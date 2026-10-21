<?php

namespace Tests\Feature;

use App\Models\PenutupanShift;
use App\Models\Transaksi;
use App\Models\User;
use App\Services\ParkirService;
use App\Services\ShiftService;
use Carbon\Carbon;
use Exception;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShiftReconciliationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $petugas;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('role', 'admin')->first();
        $this->petugas = User::where('role', 'petugas')->first();
    }

    public function test_shift_closure_calculates_cash_and_flags_discrepancy(): void
    {
        $parkirService = app(ParkirService::class);
        $shiftService = app(ShiftService::class);

        // Check in and check out a vehicle
        $transaksi = $parkirService->prosesMasuk([
            'plat_nomor' => 'B 5555 SHIFT',
            'jenis_kendaraan' => 'motor',
            'id_area' => 1,
            'id_petugas' => $this->petugas->id_user,
        ]);

        $checkout = $parkirService->prosesKeluar(
            idParkir: $transaksi->id_parkir,
            idPetugasKeluar: $this->petugas->id_user,
            metodePembayaran: 'tunai'
        );

        $mulai = Carbon::now()->subMinutes(10);
        $selesai = Carbon::now()->addMinutes(10);

        // Petugas submits physical cash with a discrepancy (e.g. system is 2000, physical cash is 1000)
        $shift = $shiftService->ajukanPenutupanShift($this->petugas->id_user, [
            'waktu_mulai' => $mulai->format('Y-m-d H:i:s'),
            'waktu_selesai' => $selesai->format('Y-m-d H:i:s'),
            'total_tunai_fisik' => 1000,
            'total_setoran' => 1000,
        ]);

        // Discrepancy should be flagged
        $this->assertNotEquals(0, $shift->selisih);
        $this->assertEquals('perlu_pemeriksaan', $shift->status);

        // Audit log created
        $this->assertDatabaseHas('tb_audit_log', [
            'aksi' => 'SHIFT_SUBMIT',
            'tabel' => 'tb_penutupan_shift',
            'id_record' => (string) $shift->id_shift,
        ]);
    }

    public function test_admin_approves_shift_and_audit_log_is_recorded(): void
    {
        $shiftService = app(ShiftService::class);

        $shift = PenutupanShift::create([
            'id_petugas' => $this->petugas->id_user,
            'waktu_mulai' => Carbon::now()->subHours(8),
            'waktu_selesai' => Carbon::now(),
            'total_tagihan' => 10000,
            'total_tunai_sistem' => 10000,
            'total_tunai_fisik' => 10000,
            'total_setoran' => 10000,
            'selisih' => 0,
            'status' => 'diajukan',
        ]);

        $reviewed = $shiftService->tinjauPenutupanShift(
            idShift: $shift->id_shift,
            idAdmin: $this->admin->id_user,
            disetujui: true,
            catatan: 'Semua rekonsiliasi sesuai fisik.'
        );

        $this->assertEquals('disetujui', $reviewed->status);
        $this->assertEquals($this->admin->id_user, $reviewed->id_admin_pemeriksa);

        $this->assertDatabaseHas('tb_audit_log', [
            'aksi' => 'SHIFT_REVIEW',
            'tabel' => 'tb_penutupan_shift',
            'id_record' => (string) $shift->id_shift,
        ]);
    }

    public function test_approved_shift_cannot_be_overwritten(): void
    {
        $shiftService = app(ShiftService::class);

        $shift = PenutupanShift::create([
            'id_petugas' => $this->petugas->id_user,
            'waktu_mulai' => Carbon::now()->subHours(8),
            'waktu_selesai' => Carbon::now(),
            'total_tagihan' => 10000,
            'total_tunai_sistem' => 10000,
            'total_tunai_fisik' => 10000,
            'total_setoran' => 10000,
            'selisih' => 0,
            'status' => 'disetujui', // already approved
        ]);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('sudah diputuskan');

        $shiftService->tinjauPenutupanShift(
            idShift: $shift->id_shift,
            idAdmin: $this->admin->id_user,
            disetujui: false
        );
    }

    public function test_reconciliation_page_renders_and_compares_sources(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.rekonsiliasi'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Rekonsiliasi')
            ->has('totalMasuk')
            ->has('totalKeluar')
            ->has('totalTagihan')
            ->has('totalPembayaranSistem')
        );
    }
}
