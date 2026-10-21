<?php

namespace App\Services;

use App\Models\AreaParkir;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Laporan & agregasi pendapatan CPD (Customer Payment Device).
 *
 * Sumber kebenaran: `tb_pembayaran` dengan status `lunas`.
 * Transaksi tanpa pembayaran (gratis / belum bayar) tidak dihitung sebagai pendapatan.
 */
class LaporanPendapatanService
{
    /**
     * Label ramah untuk metode pembayaran.
     */
    private const METODE_LABEL = [
        'tunai'    => 'Tunai',
        'qris'     => 'QRIS',
        'transfer' => 'Transfer Bank',
        'kartu'    => 'Kartu Debit/Kredit',
    ];

    /**
     * Nama bulan dalam Bahasa Indonesia (config locale aplikasi masih `en`).
     */
    private const BULAN = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
        7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
    ];

    /**
     * Query dasar pembayaran lunas dalam rentang waktu, dengan filter opsional.
     */
    private function baseQuery(Carbon $mulai, Carbon $selesai, array $filter)
    {
        $query = DB::table('tb_pembayaran as p')
            ->join('tb_transaksi as t', 't.id_parkir', '=', 'p.id_parkir')
            ->leftJoin('tb_area_parkir as a', 'a.id_area', '=', 't.id_area')
            ->leftJoin('tb_kendaraan as k', 'k.id_kendaraan', '=', 't.id_kendaraan')
            ->where('p.status', 'lunas')
            ->whereBetween('p.waktu_bayar', [$mulai, $selesai]);

        if (!empty($filter['area'])) {
            $query->where('t.id_area', (int) $filter['area']);
        }

        if (!empty($filter['metode'])) {
            $query->where('p.metode', $filter['metode']);
        }

        return $query;
    }

    /**
     * Susun laporan pendapatan lengkap untuk satu rentang periode.
     */
    public function laporan(Carbon $mulai, Carbon $selesai, array $filter = []): array
    {
        $mulai = $mulai->copy()->startOfDay();
        $selesai = $selesai->copy()->endOfDay();

        $base = fn() => $this->baseQuery($mulai, $selesai, $filter);

        // --- Ringkasan periode berjalan -------------------------------------
        $agregat = $base()
            ->selectRaw('COALESCE(SUM(p.nominal), 0) as total, COUNT(*) as transaksi')
            ->first();

        $total = (float) ($agregat->total ?? 0);
        $transaksi = (int) ($agregat->transaksi ?? 0);
        // Hitung jumlah hari kalender (bulat) agar tidak terkena pecahan
        // dari selisih timestamp startOfDay..endOfDay.
        $jumlahHari = max(1, (int) abs($mulai->copy()->startOfDay()->diffInDays($selesai->copy()->startOfDay())) + 1);

        // --- Perbandingan dengan periode sebelumnya (durasi sama) -----------
        $durasi = $selesai->copy()->diffInSeconds($mulai) + 1;
        $mulaiSebelumnya = $mulai->copy()->subSeconds($durasi);
        $selesaiSebelumnya = $mulai->copy()->subSecond();

        $agregatSebelumnya = $this->baseQuery($mulaiSebelumnya, $selesaiSebelumnya, $filter)
            ->selectRaw('COALESCE(SUM(p.nominal), 0) as total, COUNT(*) as transaksi')
            ->first();

        $totalSebelumnya = (float) ($agregatSebelumnya->total ?? 0);
        $transaksiSebelumnya = (int) ($agregatSebelumnya->transaksi ?? 0);

        // --- Tren harian (dengan hari kosong diisi nol) ----------------------
        $trenPeta = $base()
            ->selectRaw('DATE(p.waktu_bayar) as tanggal, COALESCE(SUM(p.nominal), 0) as total, COUNT(*) as transaksi')
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get()
            ->mapWithKeys(fn($r) => [$r->tanggal => (float) $r->total])
            ->all();

        $trenTransaksi = $base()
            ->selectRaw('DATE(p.waktu_bayar) as tanggal, COUNT(*) as transaksi')
            ->groupBy('tanggal')
            ->pluck('transaksi', 'tanggal')
            ->all();

        $tren = [];
        $kumulatif = 0.0;
        $cursor = $mulai->copy();
        while ($cursor->lessThanOrEqualTo($selesai)) {
            $key = $cursor->toDateString();
            $nilai = (float) ($trenPeta[$key] ?? 0);
            $kumulatif += $nilai;

            $tren[] = [
                'tanggal'      => $key,
                'label'        => $cursor->format('j') . ' ' . self::BULAN[(int) $cursor->format('n')],
                'labelPanjang' => $cursor->format('j') . ' ' . self::BULAN[(int) $cursor->format('n')] . ' ' . $cursor->format('Y'),
                'total'        => $nilai,
                'transaksi'    => (int) ($trenTransaksi[$key] ?? 0),
                'kumulatif'    => $kumulatif,
            ];

            $cursor->addDay();
        }


        // --- Distribusi per jam --------------------------------------------
        $perJamPeta = $base()
            ->selectRaw('HOUR(p.waktu_bayar) as jam, COALESCE(SUM(p.nominal), 0) as total, COUNT(*) as transaksi')
            ->groupBy('jam')
            ->get()
            ->mapWithKeys(fn($r) => [(int) $r->jam => (float) $r->total])
            ->all();

        $perJamTransaksi = $base()
            ->selectRaw('HOUR(p.waktu_bayar) as jam, COUNT(*) as transaksi')
            ->groupBy('jam')
            ->pluck('transaksi', 'jam')
            ->all();

        $perJam = [];
        for ($jam = 0; $jam < 24; $jam++) {
            $perJam[] = [
                'jam'       => $jam,
                'label'     => str_pad((string) $jam, 2, '0', STR_PAD_LEFT) . ':00',
                'total'     => (float) ($perJamPeta[$jam] ?? 0),
                'transaksi' => (int) ($perJamTransaksi[$jam] ?? 0),
            ];
        }

        // --- Komposisi metode pembayaran ------------------------------------
        $perMetode = $base()
            ->selectRaw('p.metode, COALESCE(SUM(p.nominal), 0) as total, COUNT(*) as transaksi')
            ->groupBy('p.metode')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'metode'    => $r->metode,
                'label'     => self::METODE_LABEL[$r->metode] ?? ucfirst((string) $r->metode),
                'total'     => (float) $r->total,
                'transaksi' => (int) $r->transaksi,
            ])
            ->values()
            ->all();

        // --- Pendapatan per area parkir --------------------------------------
        $perArea = $base()
            ->selectRaw("COALESCE(a.nama_area, 'Tanpa Area') as nama_area, COALESCE(SUM(p.nominal), 0) as total, COUNT(*) as transaksi")
            ->groupBy('nama_area')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'nama_area' => $r->nama_area,
                'total'     => (float) $r->total,
                'transaksi' => (int) $r->transaksi,
            ])
            ->values()
            ->all();

        // --- Pendapatan per jenis kendaraan ---------------------------------
        $perJenis = $base()
            ->selectRaw("COALESCE(k.jenis_kendaraan, 'lainnya') as jenis, COALESCE(SUM(p.nominal), 0) as total, COUNT(*) as transaksi")
            ->groupBy('jenis')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'jenis'     => $r->jenis,
                'label'     => ucfirst((string) $r->jenis),
                'total'     => (float) $r->total,
                'transaksi' => (int) $r->transaksi,
            ])
            ->values()
            ->all();

        // --- Rekap harian untuk tabel rincian (terbaru di atas) --------------
        $rekapHarian = collect($tren)->map(fn($row) => [
            'tanggal'   => $row['labelPanjang'],
            'total'     => $row['total'],
            'transaksi' => $row['transaksi'],
        ])->reverse()->values()->all();

        return [
            'periode' => [
                'mulai'       => $mulai->toDateString(),
                'selesai'     => $selesai->toDateString(),
                'jumlah_hari' => $jumlahHari,
            ],
            'ringkasan' => [
                'total'                 => $total,
                'transaksi'             => $transaksi,
                'rata_rata_transaksi'  => $transaksi > 0 ? $total / $transaksi : 0,
                'rata_rata_harian'     => $total / $jumlahHari,
                'total_sebelumnya'     => $totalSebelumnya,
                'transaksi_sebelumnya' => $transaksiSebelumnya,
                'persen_perubahan'     => $totalSebelumnya > 0
                    ? round((($total - $totalSebelumnya) / $totalSebelumnya) * 100, 1)
                    : ($total > 0 ? 100.0 : 0.0),
                'persen_perubahan_transaksi' => $transaksiSebelumnya > 0
                    ? round((($transaksi - $transaksiSebelumnya) / $transaksiSebelumnya) * 100, 1)
                    : ($transaksi > 0 ? 100.0 : 0.0),
            ],
            'tren'         => $tren,
            'per_jam'      => $perJam,
            'per_metode'   => $perMetode,
            'per_area'     => $perArea,
            'per_jenis'    => $perJenis,
            'rekap_harian' => $rekapHarian,
        ];
    }

    /**
     * Daftar area untuk filter.
     */
    public function areaOptions(): array
    {
        return AreaParkir::orderBy('nama_area')->get()->map(fn($a) => [
            'id_area'   => $a->id_area,
            'nama_area' => $a->nama_area,
        ])->all();
    }

    /**
     * Daftar metode pembayaran yang tersedia di enum `tb_pembayaran.metode`.
     */
    public function metodeOptions(): array
    {
        return collect(self::METODE_LABEL)
            ->map(fn($label, $key) => ['value' => $key, 'label' => $label])
            ->values()
            ->all();
    }
}
