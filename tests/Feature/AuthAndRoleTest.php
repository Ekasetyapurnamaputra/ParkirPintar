<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthAndRoleTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_access_admin_endpoints(): void
    {
        $admin = User::where('role', 'admin')->first();

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));
        $response->assertStatus(200);

        $response = $this->actingAs($admin)->get(route('admin.users'));
        $response->assertStatus(200);

        $response = $this->actingAs($admin)->get(route('admin.tarifs'));
        $response->assertStatus(200);

        $response = $this->actingAs($admin)->get(route('admin.rekonsiliasi'));
        $response->assertStatus(200);

        $response = $this->actingAs($admin)->get(route('admin.pendapatan'));
        $response->assertStatus(200);
    }

    public function test_petugas_cannot_access_admin_endpoints(): void
    {
        $petugas = User::where('role', 'petugas')->first();

        $response = $this->actingAs($petugas)->get(route('admin.dashboard'));
        $response->assertStatus(403);

        $response = $this->actingAs($petugas)->get(route('admin.users'));
        $response->assertStatus(403);

        $response = $this->actingAs($petugas)->get(route('admin.tarifs'));
        $response->assertStatus(403);
    }

    public function test_petugas_can_access_petugas_endpoints(): void
    {
        $petugas = User::where('role', 'petugas')->first();

        $response = $this->actingAs($petugas)->get(route('petugas.dashboard'));
        $response->assertStatus(200);

        $response = $this->actingAs($petugas)->get(route('petugas.shiftRiwayat'));
        $response->assertStatus(200);
    }

    public function test_deactivated_user_cannot_login(): void
    {
        // Create an inactive user
        $inactive = User::create([
            'nama_lengkap' => 'Inactive User',
            'username' => 'inactive_user',
            'password' => Hash::make('password123'),
            'role' => 'petugas',
            'status_aktif' => 0,
        ]);

        $response = $this->post('/login', [
            'username' => 'inactive_user',
            'password' => 'password123',
        ]);

        $response->assertSessionHasErrors('username');
        $this->assertGuest();

        // Verify rejected action is logged in audit log
        $this->assertDatabaseHas('tb_audit_log', [
            'aksi' => 'LOGIN_BLOCKED',
            'tabel' => 'tb_user',
            'status_hasil' => 'ditolak',
        ]);
    }

    public function test_legacy_sha256_verifies_and_upgrades_to_laravel_hash(): void
    {
        // User with pure SHA-256 hash
        $testUser = User::create([
            'nama_lengkap' => 'Legacy User',
            'username' => 'legacy_user',
            'password' => hash('sha256', 'legacy_pass_123'),
            'role' => 'petugas',
            'status_aktif' => 1,
        ]);

        $response = $this->post('/login', [
            'username' => 'legacy_user',
            'password' => 'legacy_pass_123',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($testUser);

        // Reload user and verify password has been upgraded to standard bcrypt hash
        $testUser->refresh();
        $this->assertTrue(Hash::check('legacy_pass_123', $testUser->password));
        $this->assertNotEquals(hash('sha256', 'legacy_pass_123'), $testUser->password);
    }
}
