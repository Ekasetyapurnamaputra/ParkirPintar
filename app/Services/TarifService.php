<?php

namespace App\Services;

use App\Models\Pengaturan;
use App\Models\Tarif;
use App\Models\Transaksi;
use Carbon\Carbon;

class TarifService
{
    /**
     * Calculate parking duration in hours and total fee
     */
    public function hitungBiaya(Transaksi $transaksi, ?Carbon $waktuKeluar = null): array
    {
        $keluar = $waktuKeluar ?? Carbon::now();
        $masuk = Carbon::parse($transaksi->waktu_masuk);

        // Difference in minutes
        $diffMinutes = max(1, $masuk->diffInMinutes($keluar));

        // Rounding rule from tb_pengaturan (default 60 minutes)
        $pembulatanMenit = (int) Pengaturan::get('pembulatan_durasi_menit', 60);
        if ($pembulatanMenit <= 0) {
            $pembulatanMenit = 60;
        }

        // Calculate hours rounded up
        $durasiJam = (int) ceil($diffMinutes / $pembulatanMenit);
        if ($durasiJam < 1) {
            $durasiJam = 1;
        }

        // Use snapshot tariff if available, otherwise fallback to current tb_tarif
        $tarifPerJam = $transaksi->snapshot_tarif_per_jam;
        if (!$tarifPerJam || $tarifPerJam <= 0) {
            $tarifRow = Tarif::find($transaksi->id_tarif);
            $tarifPerJam = $tarifRow ? (float) $tarifRow->tarif_per_jam : 2000;
        }

        $biayaTotal = $durasiJam * $tarifPerJam;

        return [
            'durasi_menit' => $diffMinutes,
            'durasi_jam' => $durasiJam,
            'tarif_per_jam' => (float) $tarifPerJam,
            'biaya_total' => (float) $biayaTotal,
            'waktu_keluar' => $keluar,
        ];
    }
}

