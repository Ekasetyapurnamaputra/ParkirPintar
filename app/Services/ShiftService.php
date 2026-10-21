<?php

namespace App\Services;

use App\Models\Pembayaran;
use App\Models\PenutupanShift;
use App\Models\Transaksi;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;

class ShiftService
{
    /**
     * Compute system shift stats for a given time window
     */
    public function hitungRingkasanShift(int $idPetugas, Carbon $mulai, Carbon $selesai): array
    {
        $masuk = Transaksi::where('id_user', $idPetugas)
            ->whereBetween('waktu_masuk', [$mulai, $selesai])
            ->count();

        $keluarTransaksi = Transaksi::where('id_petugas_keluar', $idPetugas)
            ->whereBetween('waktu_keluar', [$mulai, $selesai])
            ->where('status', 'keluar')
            ->get();

        $keluar = $keluarTransaksi->count();
        $totalTagihan = (float) $keluarTransaksi->sum('biaya_total');

        $tunaiSistem = (float) Pembayaran::where('id_petugas', $idPetugas)
            ->where('metode', 'tunai')
            ->where('status', 'lunas')
            ->whereBetween('waktu_bayar', [$mulai, $selesai])
            ->sum('nominal');

        $nontunaiSistem = (float) Pembayaran::where('id_petugas', $idPetugas)
            ->where('metode', '!=', 'tunai')
            ->where('status', 'lunas')
            ->whereBetween('waktu_bayar', [$mulai, $selesai])
            ->sum('nominal');

        return [
            'jumlah_kendaraan_masuk' => $masuk,
            'jumlah_kendaraan_keluar' => $keluar,
            'jumlah_sesi_valid' => $keluar,
            'total_tagihan' => $totalTagihan,
            'total_tunai_sistem' => $tunaiSistem,
            'total_nontunai_sistem' => $nontunaiSistem,
        ];
    }

    /**
     * Submit shift closure by petugas
     */
    public function ajukanPenutupanShift(int $idPetugas, array $data): PenutupanShift
    {
        return DB::transaction(function () use ($idPetugas, $data) {
            $mulai = Carbon::parse($data['waktu_mulai']);
            $selesai = Carbon::parse($data['waktu_selesai'] ?? Carbon::now());

            $stats = $this->hitungRingkasanShift($idPetugas, $mulai, $selesai);

            $tunaiFisik = (float) ($data['total_tunai_fisik'] ?? 0);
            $totalSetoran = (float) ($data['total_setoran'] ?? $tunaiFisik);

            // Calculate discrepancy
            $selisih = $tunaiFisik - $stats['total_tunai_sistem'];

            // If discrepancy exists, flag for inspection
            $status = ($selisih != 0) ? 'perlu_pemeriksaan' : 'diajukan';

            $shift = PenutupanShift::create([
                'id_petugas' => $idPetugas,
                'waktu_mulai' => $mulai,
                'waktu_selesai' => $selesai,
                'jumlah_kendaraan_masuk' => $stats['jumlah_kendaraan_masuk'],
                'jumlah_kendaraan_keluar' => $stats['jumlah_kendaraan_keluar'],
                'jumlah_sesi_valid' => $stats['jumlah_sesi_valid'],
                'total_tagihan' => $stats['total_tagihan'],
                'total_tunai_sistem' => $stats['total_tunai_sistem'],
                'total_nontunai_sistem' => $stats['total_nontunai_sistem'],
                'total_tunai_fisik' => $tunaiFisik,
                'total_setoran' => $totalSetoran,
                'selisih' => $selisih,
                'bukti_setoran' => $data['bukti_setoran'] ?? null,
                'status' => $status,
            ]);

            AuditService::log(
                aksi: 'SHIFT_SUBMIT',
                tabel: 'tb_penutupan_shift',
                idRecord: (string) $shift->id_shift,
                dataBaru: $shift->toArray(),
                alasan: "Pengajuan penutupan shift petugas #{$idPetugas}. Fisik: Rp {$tunaiFisik}, Sistem: Rp {$stats['total_tunai_sistem']}, Selisih: Rp {$selisih}",
                userId: $idPetugas
            );

            return $shift;
        });
    }

    /**
     * Review shift closure by Admin
     */
    public function tinjauPenutupanShift(int $idShift, int $idAdmin, bool $disetujui, ?string $catatan = null): PenutupanShift
    {
        return DB::transaction(function () use ($idShift, $idAdmin, $disetujui, $catatan) {
            $shift = PenutupanShift::where('id_shift', $idShift)->lockForUpdate()->firstOrFail();

            if (in_array($shift->status, ['disetujui', 'ditolak'])) {
                throw new Exception("Laporan penutupan shift ini sudah diputuskan ({$shift->status}) dan tidak dapat diubah langsung.");
            }

            $dataLama = $shift->toArray();
            $status = $disetujui ? 'disetujui' : 'ditolak';

            $shift->update([
                'status' => $status,
                'id_admin_pemeriksa' => $idAdmin,
                'waktu_diperiksa' => Carbon::now(),
                'catatan_pemeriksa' => $catatan,
            ]);

            AuditService::log(
                aksi: 'SHIFT_REVIEW',
                tabel: 'tb_penutupan_shift',
                idRecord: (string) $shift->id_shift,
                dataLama: $dataLama,
                dataBaru: $shift->toArray(),
                alasan: "Pemeriksaan shift #{$idShift} oleh Admin: {$status}. Catatan: {$catatan}",
                userId: $idAdmin
            );

            return $shift;
        });
    }
}

