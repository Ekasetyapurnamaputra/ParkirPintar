<?php

namespace App\Services;

use App\Models\AreaParkir;
use App\Models\Kendaraan;
use App\Models\Pembayaran;
use App\Models\Reservasi;
use App\Models\SlotParkir;
use App\Models\Tarif;
use App\Models\Transaksi;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ParkirService
{
    public function __construct(
        protected TarifService $tarifService
    ) {}

    /**
     * Process vehicle check-in
     */
    public function prosesMasuk(array $data): Transaksi
    {
        return DB::transaction(function () use ($data) {
            $platNomor = strtoupper(trim($data['plat_nomor']));
            $jenisKendaraan = strtolower($data['jenis_kendaraan'] ?? 'motor');
            $idArea = (int) $data['id_area'];
            $idPetugas = (int) $data['id_petugas'];
            $kodeReservasi = !empty($data['kode_reservasi']) ? trim($data['kode_reservasi']) : null;

            // 1. Check if vehicle already has an active parking session
            $activeSession = Transaksi::whereHas('kendaraan', function ($q) use ($platNomor) {
                $q->where('plat_nomor', $platNomor);
            })->where('status', 'masuk')->lockForUpdate()->first();

            if ($activeSession) {
                throw new Exception("Kendaraan dengan plat nomor {$platNomor} sudah memiliki sesi parkir aktif (Tiket: {$activeSession->kode_tiket})!");
            }

            // 2. Lock Area
            $area = AreaParkir::where('id_area', $idArea)->lockForUpdate()->firstOrFail();

            $reservasi = null;
            $slot = null;

            if ($kodeReservasi) {
                $reservasi = Reservasi::where('kode_reservasi', $kodeReservasi)
                    ->lockForUpdate()
                    ->first();

                if (!$reservasi) {
                    throw new Exception("Kode reservasi {$kodeReservasi} tidak ditemukan.");
                }

                if ($reservasi->status !== 'dipesan') {
                    throw new Exception("Status reservasi bukan 'dipesan' (status saat ini: {$reservasi->status}).");
                }

                if ($reservasi->isExpired()) {
                    $reservasi->update(['status' => 'noshow']);
                    // Free the slot
                    SlotParkir::where('id_slot', $reservasi->id_slot)->update(['status' => 'tersedia']);
                    throw new Exception("Reservasi {$kodeReservasi} sudah kedaluwarsa (No-Show).");
                }

                // Verify plate number matches
                if (strtoupper($reservasi->kendaraan->plat_nomor) !== $platNomor) {
                    throw new Exception("Plat nomor tidak sesuai dengan data reservasi ({$reservasi->kendaraan->plat_nomor}).");
                }

                $slot = SlotParkir::where('id_slot', $reservasi->id_slot)->lockForUpdate()->first();
            } else {
                // Direct Entry: Check area capacity
                if ($area->terisi >= $area->kapasitas) {
                    throw new Exception("Area parkir {$area->nama_area} sudah penuh (Kapasitas: {$area->kapasitas}).");
                }

                // Pick requested slot or find first available slot in area
                if (!empty($data['id_slot'])) {
                    $slot = SlotParkir::where('id_slot', $data['id_slot'])
                        ->where('id_area', $idArea)
                        ->lockForUpdate()
                        ->first();

                    if (!$slot || $slot->status !== 'tersedia') {
                        throw new Exception("Slot parkir yang dipilih tidak tersedia.");
                    }
                } else {
                    $slot = SlotParkir::where('id_area', $idArea)
                        ->where('jenis_kendaraan', $jenisKendaraan)
                        ->where('status', 'tersedia')
                        ->lockForUpdate()
                        ->first();

                    if (!$slot) {
                        // Fallback: any available slot in area
                        $slot = SlotParkir::where('id_area', $idArea)
                            ->where('status', 'tersedia')
                            ->lockForUpdate()
                            ->first();
                    }

                    if (!$slot) {
                        throw new Exception("Tidak ada slot kosong yang tersedia di area ini.");
                    }
                }
            }

            // 3. Find or create Kendaraan record
            $kendaraan = Kendaraan::where('plat_nomor', $platNomor)->first();
            if (!$kendaraan) {
                $kendaraan = Kendaraan::create([
                    'plat_nomor' => $platNomor,
                    'jenis_kendaraan' => $jenisKendaraan,
                    'warna' => $data['warna'] ?? null,
                    'pemilik' => $data['pemilik'] ?? null,
                    'id_user' => $reservasi ? $reservasi->id_user : $idPetugas,
                ]);
            }

            // 4. Determine Tariff Snapshot
            $tarif = Tarif::where('jenis_kendaraan', $jenisKendaraan)->first()
                ?? Tarif::where('jenis_kendaraan', 'lainnya')->first();

            $tarifPerJam = $tarif ? (float) $tarif->tarif_per_jam : 2000;
            $idTarif = $tarif ? $tarif->id_tarif : 1;

            // 5. Generate Unique Ticket Code
            $kodeTiket = 'TKT-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // 6. Create Transaksi
            $transaksi = Transaksi::create([
                'kode_tiket' => $kodeTiket,
                'id_kendaraan' => $kendaraan->id_kendaraan,
                'id_area' => $idArea,
                'id_slot' => $slot?->id_slot,
                'id_user' => $idPetugas,
                'id_tarif' => $idTarif,
                'snapshot_tarif_per_jam' => $tarifPerJam,
                'waktu_masuk' => Carbon::now(),
                'status' => 'masuk',
                'status_pembayaran' => 'belum_bayar',
            ]);

            // 7. Update Slot to 'terisi'
            if ($slot) {
                $slot->update(['status' => 'terisi']);
            }

            // 8. Update Area terisi
            $area->terisi = min($area->kapasitas, $area->terisi + 1);
            $area->save();

            // 9. Update Reservasi if used
            if ($reservasi) {
                $reservasi->update([
                    'status' => 'masuk',
                    'waktu_masuk_aktual' => Carbon::now(),
                ]);
            }

            // 10. Audit Log
            AuditService::log(
                aksi: 'CHECKIN',
                tabel: 'tb_transaksi',
                idRecord: (string) $transaksi->id_parkir,
                dataBaru: $transaksi->toArray(),
                alasan: "Kendaraan {$platNomor} masuk ke {$area->nama_area} (Slot: " . ($slot?->kode_slot ?? '-') . ")",
                userId: $idPetugas
            );

            return $transaksi;
        });
    }

    /**
     * Process vehicle check-out
     */
    public function prosesKeluar(
        int $idParkir,
        int $idPetugasKeluar,
        string $metodePembayaran = 'tunai',
        ?string $catatan = null
    ): Transaksi {
        return DB::transaction(function () use ($idParkir, $idPetugasKeluar, $metodePembayaran, $catatan) {
            $transaksi = Transaksi::where('id_parkir', $idParkir)->lockForUpdate()->firstOrFail();

            if ($transaksi->status !== 'masuk') {
                throw new Exception("Transaksi ini sudah selesai (status: {$transaksi->status}). Kendaraan tidak dapat dikeluarkan lagi.");
            }

            $waktuKeluar = Carbon::now();
            $biayaData = $this->tarifService->hitungBiaya($transaksi, $waktuKeluar);

            // 1. Create or confirm payment
            $kodePembayaran = 'PAY-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $pembayaran = Pembayaran::create([
                'id_parkir' => $transaksi->id_parkir,
                'kode_pembayaran' => $kodePembayaran,
                'nominal' => $biayaData['biaya_total'],
                'metode' => in_array($metodePembayaran, ['tunai', 'qris', 'transfer', 'kartu']) ? $metodePembayaran : 'tunai',
                'status' => 'lunas',
                'referensi_transaksi' => 'PAY-' . strtoupper(Str::random(8)),
                'waktu_bayar' => $waktuKeluar,
                'waktu_konfirmasi' => $waktuKeluar,
                'id_petugas' => $idPetugasKeluar,
                'catatan' => $catatan,
            ]);

            $dataLama = $transaksi->toArray();

            // 2. Update Transaksi
            $transaksi->update([
                'waktu_keluar' => $waktuKeluar,
                'durasi_jam' => $biayaData['durasi_jam'],
                'biaya_total' => $biayaData['biaya_total'],
                'status' => 'keluar',
                'status_pembayaran' => 'lunas',
                'id_petugas_keluar' => $idPetugasKeluar,
            ]);

            // 3. Free the Slot
            if ($transaksi->id_slot) {
                SlotParkir::where('id_slot', $transaksi->id_slot)->update(['status' => 'tersedia']);
            }

            // 4. Update Area terisi (safely decrement, no negative values)
            $area = AreaParkir::where('id_area', $transaksi->id_area)->lockForUpdate()->first();
            if ($area) {
                $area->terisi = max(0, $area->terisi - 1);
                $area->save();
            }

            // 5. Update linked reservation if exists
            $reservasi = Reservasi::where('id_kendaraan', $transaksi->id_kendaraan)
                ->where('status', 'masuk')
                ->first();
            if ($reservasi) {
                $reservasi->update(['status' => 'selesai']);
            }

            // 6. Audit Log
            AuditService::log(
                aksi: 'CHECKOUT',
                tabel: 'tb_transaksi',
                idRecord: (string) $transaksi->id_parkir,
                dataLama: $dataLama,
                dataBaru: $transaksi->toArray(),
                alasan: "Kendaraan keluar. Total biaya: Rp " . number_format($biayaData['biaya_total'], 0, ',', '.') . " ({$metodePembayaran})",
                userId: $idPetugasKeluar
            );

            return $transaksi;
        });
    }

    /**
     * Submit transaction correction (by petugas or admin)
     */
    public function ajukanKoreksi(int $idParkir, int $idPetugas, string $alasan): Transaksi
    {
        return DB::transaction(function () use ($idParkir, $idPetugas, $alasan) {
            $transaksi = Transaksi::where('id_parkir', $idParkir)->lockForUpdate()->firstOrFail();

            $dataLama = $transaksi->toArray();

            $transaksi->update([
                'catatan_koreksi' => $alasan,
                'status_koreksi' => 'pending',
                'koreksi_oleh' => $idPetugas,
            ]);

            AuditService::log(
                aksi: 'CORRECTION_REQUEST',
                tabel: 'tb_transaksi',
                idRecord: (string) $transaksi->id_parkir,
                dataLama: $dataLama,
                dataBaru: $transaksi->toArray(),
                alasan: "Pengajuan koreksi transaksi: {$alasan}",
                userId: $idPetugas
            );

            return $transaksi;
        });
    }

    /**
     * Approve or reject correction (Admin only)
     */
    public function tanganiKoreksi(int $idParkir, int $idAdmin, bool $disetujui, ?string $catatanAdmin = null): Transaksi
    {
        return DB::transaction(function () use ($idParkir, $idAdmin, $disetujui, $catatanAdmin) {
            $transaksi = Transaksi::where('id_parkir', $idParkir)->lockForUpdate()->firstOrFail();

            $dataLama = $transaksi->toArray();
            $statusKoreksi = $disetujui ? 'disetujui' : 'ditolak';

            $transaksi->update([
                'status_koreksi' => $statusKoreksi,
                'catatan_koreksi' => $transaksi->catatan_koreksi . "\n[Review Admin: {$catatanAdmin}]",
            ]);

            AuditService::log(
                aksi: 'CORRECTION_REVIEW',
                tabel: 'tb_transaksi',
                idRecord: (string) $transaksi->id_parkir,
                dataLama: $dataLama,
                dataBaru: $transaksi->toArray(),
                alasan: "Keputusan review koreksi: {$statusKoreksi}. Catatan: {$catatanAdmin}",
                userId: $idAdmin
            );

            return $transaksi;
        });
    }
}

