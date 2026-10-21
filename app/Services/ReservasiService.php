<?php

namespace App\Services;

use App\Models\Kendaraan;
use App\Models\Pengaturan;
use App\Models\Reservasi;
use App\Models\SlotParkir;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservasiService
{
    /**
     * Create a new reservation for customer
     */
    public function buatReservasi(
        User $user,
        int $idKendaraan,
        int $idSlot,
        Carbon $jadwalKedatangan
    ): Reservasi {
        return DB::transaction(function () use ($user, $idKendaraan, $idSlot, $jadwalKedatangan) {
            // Verify vehicle ownership if customer
            $kendaraan = Kendaraan::findOrFail($idKendaraan);
            if ($user->isPelanggan() && $kendaraan->id_user !== $user->id_user) {
                throw new Exception("Kendaraan ini bukan milik akun Anda.");
            }

            // Check if vehicle already has an active reservation
            $activeRsv = Reservasi::where('id_kendaraan', $idKendaraan)
                ->where('status', 'dipesan')
                ->first();

            if ($activeRsv) {
                throw new Exception("Kendaraan ini sudah memiliki reservasi aktif ({$activeRsv->kode_reservasi}).");
            }

            // Lock and verify slot
            $slot = SlotParkir::where('id_slot', $idSlot)->lockForUpdate()->firstOrFail();
            if ($slot->status !== 'tersedia') {
                throw new Exception("Slot parkir {$slot->kode_slot} sudah tidak tersedia (status: {$slot->status}).");
            }

            // Vehicle type must match slot allowed type (unless slot is 'lainnya')
            if ($slot->jenis_kendaraan !== 'lainnya' && $slot->jenis_kendaraan !== $kendaraan->jenis_kendaraan) {
                throw new Exception("Jenis kendaraan ({$kendaraan->jenis_kendaraan}) tidak sesuai dengan jenis slot ({$slot->jenis_kendaraan}).");
            }

            // Calculate grace period
            $masaTenggang = (int) Pengaturan::get('masa_tenggang_reservasi_menit', 15);
            $batasKedatangan = (clone $jadwalKedatangan)->addMinutes($masaTenggang);

            $kodeReservasi = 'RSV-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $reservasi = Reservasi::create([
                'kode_reservasi' => $kodeReservasi,
                'id_user' => $user->id_user,
                'id_kendaraan' => $idKendaraan,
                'id_slot' => $idSlot,
                'waktu_booking' => Carbon::now(),
                'jadwal_kedatangan' => $jadwalKedatangan,
                'batas_kedatangan' => $batasKedatangan,
                'status' => 'dipesan',
            ]);

            // Mark slot as dipesan
            $slot->update(['status' => 'dipesan']);

            AuditService::log(
                aksi: 'RESERVATION_CREATE',
                tabel: 'tb_reservasi',
                idRecord: (string) $reservasi->id_reservasi,
                dataBaru: $reservasi->toArray(),
                alasan: "Pelanggan {$user->nama_lengkap} memesan slot {$slot->kode_slot} untuk jadwal " . $jadwalKedatangan->format('Y-m-d H:i'),
                userId: $user->id_user
            );

            return $reservasi;
        });
    }

    /**
     * Cancel an active reservation
     */
    public function batalkanReservasi(int $idReservasi, User $actor, ?string $alasan = null): Reservasi
    {
        return DB::transaction(function () use ($idReservasi, $actor, $alasan) {
            $reservasi = Reservasi::where('id_reservasi', $idReservasi)->lockForUpdate()->firstOrFail();

            if ($actor->isPelanggan() && $reservasi->id_user !== $actor->id_user) {
                throw new Exception("Anda tidak memiliki hak untuk membatalkan reservasi ini.");
            }

            if ($reservasi->status !== 'dipesan') {
                throw new Exception("Reservasi dengan status '{$reservasi->status}' tidak dapat dibatalkan.");
            }

            $dataLama = $reservasi->toArray();

            $reservasi->update([
                'status' => 'dibatalkan',
                'waktu_batal' => Carbon::now(),
                'alasan_batal' => $alasan ?? 'Dibatalkan oleh pengguna',
            ]);

            // Release slot back to tersedia
            SlotParkir::where('id_slot', $reservasi->id_slot)->update(['status' => 'tersedia']);

            AuditService::log(
                aksi: 'RESERVATION_CANCEL',
                tabel: 'tb_reservasi',
                idRecord: (string) $reservasi->id_reservasi,
                dataLama: $dataLama,
                dataBaru: $reservasi->toArray(),
                alasan: "Reservasi {$reservasi->kode_reservasi} dibatalkan: {$alasan}",
                userId: $actor->id_user
            );

            return $reservasi;
        });
    }

    /**
     * Process expired reservations into No-Show status and release slots
     */
    public function prosesKedaluwarsaNoShow(): int
    {
        $expiredReservations = Reservasi::where('status', 'dipesan')
            ->where('batas_kedatangan', '<', Carbon::now())
            ->get();

        $count = 0;
        foreach ($expiredReservations as $rsv) {
            DB::transaction(function () use ($rsv, &$count) {
                $locked = Reservasi::where('id_reservasi', $rsv->id_reservasi)->lockForUpdate()->first();
                if ($locked && $locked->status === 'dipesan' && Carbon::now()->greaterThan($locked->batas_kedatangan)) {
                    $dataLama = $locked->toArray();

                    $locked->update([
                        'status' => 'noshow',
                        'alasan_batal' => 'Pelanggan tidak hadir hingga batas kedatangan (No-Show otomatis).',
                    ]);

                    // Release slot
                    SlotParkir::where('id_slot', $locked->id_slot)->update(['status' => 'tersedia']);

                    AuditService::log(
                        aksi: 'RESERVATION_NOSHOW',
                        tabel: 'tb_reservasi',
                        idRecord: (string) $locked->id_reservasi,
                        dataLama: $dataLama,
                        dataBaru: $locked->toArray(),
                        alasan: "Reservasi {$locked->kode_reservasi} No-Show otomatis setelah batas kedatangan.",
                        userId: null
                    );

                    $count++;
                }
            });
        }

        return $count;
    }
}

