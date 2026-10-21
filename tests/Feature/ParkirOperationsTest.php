<?php

namespace Tests\Feature;

use App\Models\AreaParkir;
use App\Models\Kendaraan;
use App\Models\Pembayaran;
use App\Models\SlotParkir;
use App\Models\Tarif;
use App\Models\Transaksi;
use App\Models\User;
use App\Services\ParkirService;
use Exception;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ParkirOperationsTest extends TestCase
{
    use DatabaseTransactions;

    protected User $petugas;
    protected AreaParkir $areaMotor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->petugas = User::where('role', 'petugas')->first();
        $this->areaMotor = AreaParkir::where('id_area', 1)->first();
    }

    public function test_valid_checkin_creates_one_session_assigns_slot_and_snapshots_tariff(): void
    {
        $parkirService = app(ParkirService::class);

        $initialTerisi = $this->areaMotor->terisi;

        $transaksi = $parkirService->prosesMasuk([
            'plat_nomor' => 'B 9999 TEST',
            'jenis_kendaraan' => 'motor',
            'id_area' => 1,
            'id_petugas' => $this->petugas->id_user,
            'warna' => 'Biru',
            'pemilik' => 'Test Owner',
        ]);

        $this->assertNotNull($transaksi->kode_tiket);
        $this->assertEquals('masuk', $transaksi->status);
        $this->assertEquals(2000, $transaksi->snapshot_tarif_per_jam);
        $this->assertNotNull($transaksi->id_slot);

        // Slot marked as terisi
        $slot = SlotParkir::find($transaksi->id_slot);
        $this->assertEquals('terisi', $slot->status);

        // Area terisi incremented
        $this->areaMotor->refresh();
        $this->assertEquals($initialTerisi + 1, $this->areaMotor->terisi);

        // Audit log created
        $this->assertDatabaseHas('tb_audit_log', [
            'aksi' => 'CHECKIN',
            'tabel' => 'tb_transaksi',
            'id_record' => (string) $transaksi->id_parkir,
        ]);
    }

    public function test_system_prevents_duplicate_active_sessions_for_same_vehicle(): void
    {
        $parkirService = app(ParkirService::class);

        // First check-in
        $parkirService->prosesMasuk([
            'plat_nomor' => 'B 8888 DUP',
            'jenis_kendaraan' => 'motor',
            'id_area' => 1,
            'id_petugas' => $this->petugas->id_user,
        ]);

        // Attempt second check-in with the same plate number
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('sudah memiliki sesi parkir aktif');

        $parkirService->prosesMasuk([
            'plat_nomor' => 'B 8888 DUP',
            'jenis_kendaraan' => 'motor',
            'id_area' => 1,
            'id_petugas' => $this->petugas->id_user,
        ]);
    }

    public function test_system_rejects_checkin_when_capacity_is_full(): void
    {
        $parkirService = app(ParkirService::class);

        // Artificially set terisi to capacity
        $this->areaMotor->terisi = $this->areaMotor->kapasitas;
        $this->areaMotor->save();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('sudah penuh');

        $parkirService->prosesMasuk([
            'plat_nomor' => 'B 7777 FULL',
            'jenis_kendaraan' => 'motor',
            'id_area' => 1,
            'id_petugas' => $this->petugas->id_user,
        ]);
    }

    public function test_valid_checkout_calculates_cost_records_payment_and_frees_slot(): void
    {
        $parkirService = app(ParkirService::class);

        $transaksi = $parkirService->prosesMasuk([
            'plat_nomor' => 'B 1111 OUT',
            'jenis_kendaraan' => 'motor',
            'id_area' => 1,
            'id_petugas' => $this->petugas->id_user,
        ]);

        $slotId = $transaksi->id_slot;

        // Perform checkout
        $checkout = $parkirService->prosesKeluar(
            idParkir: $transaksi->id_parkir,
            idPetugasKeluar: $this->petugas->id_user,
            metodePembayaran: 'tunai'
        );

        $this->assertEquals('keluar', $checkout->status);
        $this->assertEquals('lunas', $checkout->status_pembayaran);
        $this->assertGreaterThanOrEqual(1, $checkout->durasi_jam);
        $this->assertGreaterThanOrEqual(2000, $checkout->biaya_total);

        // Slot is freed back to tersedia
        $slot = SlotParkir::find($slotId);
        $this->assertEquals('tersedia', $slot->status);

        // Payment recorded
        $this->assertDatabaseHas('tb_pembayaran', [
            'id_parkir' => $transaksi->id_parkir,
            'status' => 'lunas',
            'metode' => 'tunai',
        ]);
    }

    public function test_cannot_checkout_twice_for_same_session(): void
    {
        $parkirService = app(ParkirService::class);

        $transaksi = $parkirService->prosesMasuk([
            'plat_nomor' => 'B 2222 TWICE',
            'jenis_kendaraan' => 'motor',
            'id_area' => 1,
            'id_petugas' => $this->petugas->id_user,
        ]);

        // First checkout
        $parkirService->prosesKeluar(
            idParkir: $transaksi->id_parkir,
            idPetugasKeluar: $this->petugas->id_user,
            metodePembayaran: 'tunai'
        );

        // Second checkout attempt must fail
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('sudah selesai');

        $parkirService->prosesKeluar(
            idParkir: $transaksi->id_parkir,
            idPetugasKeluar: $this->petugas->id_user,
            metodePembayaran: 'tunai'
        );
    }

    public function test_past_transaction_maintains_snapshot_tariff_when_tariff_is_updated(): void
    {
        $parkirService = app(ParkirService::class);

        // Check in when rate is 2000
        $transaksi = $parkirService->prosesMasuk([
            'plat_nomor' => 'B 3333 TARIF',
            'jenis_kendaraan' => 'motor',
            'id_area' => 1,
            'id_petugas' => $this->petugas->id_user,
        ]);

        $this->assertEquals(2000, $transaksi->snapshot_tarif_per_jam);

        // Admin updates motor tariff to 5000
        $tarif = Tarif::where('jenis_kendaraan', 'motor')->first();
        $tarif->tarif_per_jam = 5000;
        $tarif->save();

        // Check out: fee should still be based on snapshot tariff (2000), not the new rate (5000)!
        $checkout = $parkirService->prosesKeluar(
            idParkir: $transaksi->id_parkir,
            idPetugasKeluar: $this->petugas->id_user,
            metodePembayaran: 'tunai'
        );

        $this->assertEquals(2000, $checkout->biaya_total);
    }

    public function test_petugas_cannot_permanently_delete_transaction(): void
    {
        // There is no DELETE route for transactions in web.php
        $response = $this->actingAs($this->petugas)->delete('/admin/transaksi/1');
        $response->assertStatus(404);

        $response = $this->actingAs($this->petugas)->delete('/petugas/transaksi/1');
        $response->assertStatus(404);

        // Transaction 1 must still exist
        $this->assertDatabaseHas('tb_transaksi', ['id_parkir' => 1]);
    }
}

