<?php

namespace App\Http\Controllers;

use App\Models\AreaParkir;
use App\Models\PenutupanShift;
use App\Models\Reservasi;
use App\Models\SlotParkir;
use App\Models\Transaksi;
use App\Services\ParkirService;
use App\Services\ShiftService;
use App\Services\TarifService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PetugasController extends Controller
{
    public function __construct(
        protected ParkirService $parkirService,
        protected TarifService $tarifService,
        protected ShiftService $shiftService
    ) {}

    public function dashboard()
    {
        $areas = AreaParkir::with('slots')->get()->map(fn($a) => [
            'id_area'   => $a->id_area,
            'nama_area' => $a->nama_area,
            'kapasitas' => $a->kapasitas,
            'terisi'    => $a->terisi,
            'slots'     => $a->slots->map(fn($s) => [
                'id_slot'   => $s->id_slot,
                'kode_slot' => $s->kode_slot,
                'status'    => $s->status,
            ]),
        ]);

        $totalKapasitas = AreaParkir::sum('kapasitas');
        $totalTerisi = Transaksi::where('status', 'masuk')->count();
        $totalSlotTersedia = SlotParkir::where('status', 'tersedia')->count();
        $totalSlotDipesan = SlotParkir::where('status', 'dipesan')->count();

        // Active parking sessions
        $sesiAktifQuery = Transaksi::with(['kendaraan', 'area', 'slot', 'petugasMasuk'])
            ->where('status', 'masuk')
            ->orderBy('waktu_masuk', 'desc')
            ->paginate(15);

        // Calculate current estimated fee for each active session
        $now = Carbon::now();
        $sesiAktif = $sesiAktifQuery->through(function ($sesi) use ($now) {
            $biayaInfo = $this->tarifService->hitungBiaya($sesi, $now);
            return [
                'id_parkir'            => $sesi->id_parkir,
                'kode_tiket'           => $sesi->kode_tiket,
                'plat_nomor'           => $sesi->kendaraan?->plat_nomor,
                'jenis_kendaraan'      => $sesi->kendaraan?->jenis_kendaraan,
                'nama_area'            => $sesi->area?->nama_area,
                'kode_slot'            => $sesi->slot?->kode_slot ?? '-',
                'waktu_masuk'          => $sesi->waktu_masuk->format('Y-m-d H:i:s'),
                'durasi_jam'           => $biayaInfo['durasi_jam'],
                'estimasi_biaya'       => $biayaInfo['biaya_total'],
                'tarif_per_jam'        => $biayaInfo['tarif_per_jam'],
                'status_koreksi'       => $sesi->status_koreksi,
                'petugas_masuk'        => $sesi->petugasMasuk?->nama_lengkap,
            ];
        });

        // Active reservations waiting for arrival
        $reservasiMenunggu = Reservasi::with(['user', 'kendaraan', 'slot'])
            ->where('status', 'dipesan')
            ->where('batas_kedatangan', '>=', Carbon::now())
            ->orderBy('jadwal_kedatangan', 'asc')
            ->get()
            ->map(fn($r) => [
                'id_reservasi'      => $r->id_reservasi,
                'kode_reservasi'    => $r->kode_reservasi,
                'nama_pemesan'      => $r->user?->nama_lengkap,
                'plat_nomor'        => $r->kendaraan?->plat_nomor,
                'kode_slot'         => $r->slot?->kode_slot,
                'jadwal_kedatangan' => $r->jadwal_kedatangan->format('Y-m-d H:i'),
                'batas_kedatangan'  => $r->batas_kedatangan->format('Y-m-d H:i'),
            ]);

        // Available slots for form
        $slotsTersedia = SlotParkir::where('status', 'tersedia')
            ->orderBy('kode_slot')
            ->get(['id_slot', 'id_area', 'kode_slot', 'status']);

        // Today's shift preview for currently logged in petugas
        $shiftPreview = $this->shiftService->hitungRingkasanShift(
            Auth::id(),
            Carbon::today()->startOfDay(),
            Carbon::now()
        );

        return Inertia::render('Petugas/Dashboard', [
            'areas'             => $areas,
            'stats'             => [
                'totalKapasitas'    => $totalKapasitas,
                'totalTerisi'       => $totalTerisi,
                'totalSlotTersedia' => $totalSlotTersedia,
                'totalSlotDipesan'  => $totalSlotDipesan,
            ],
            'sesiAktif'         => $sesiAktif,
            'reservasiMenunggu' => $reservasiMenunggu,
            'slotsTersedia'     => $slotsTersedia,
            'shiftPreview'      => $shiftPreview,
        ]);
    }

    public function prosesMasuk(Request $request)
    {
        $request->validate([
            'plat_nomor'      => 'required|string|max:15',
            'jenis_kendaraan' => 'required|in:motor,mobil,lainnya',
            'id_area'         => 'required|exists:tb_area_parkir,id_area',
            'id_slot'         => 'nullable|exists:tb_slot_parkir,id_slot',
            'kode_reservasi'  => 'nullable|string',
            'warna'           => 'nullable|string|max:20',
            'pemilik'         => 'nullable|string|max:100',
        ]);

        try {
            $data = $request->only(['plat_nomor', 'jenis_kendaraan', 'id_area', 'id_slot', 'kode_reservasi', 'warna', 'pemilik']);
            $data['id_petugas'] = Auth::id();

            $transaksi = $this->parkirService->prosesMasuk($data);

            return redirect()->route('petugas.dashboard')
                ->with('success', "Kendaraan {$transaksi->kendaraan->plat_nomor} berhasil masuk! Kode Tiket: {$transaksi->kode_tiket}");
        } catch (Exception $e) {
            return back()->withInput()->with('error', $e->getMessage());
        }
    }

    public function hitungKeluar(Request $request)
    {
        $keyword = trim($request->query('keyword', ''));

        if (empty($keyword)) {
            return response()->json(['error' => 'Masukkan plat nomor atau kode tiket.'], 400);
        }

        $transaksi = Transaksi::with(['kendaraan', 'area', 'slot', 'petugasMasuk'])
            ->where('status', 'masuk')
            ->where(function ($q) use ($keyword) {
                $q->where('kode_tiket', $keyword)
                  ->orWhereHas('kendaraan', function ($k) use ($keyword) {
                      $k->where('plat_nomor', $keyword);
                  });
            })->first();

        if (!$transaksi) {
            return response()->json(['error' => 'Transaksi parkir aktif tidak ditemukan untuk tiket / plat nomor ini.'], 404);
        }

        $waktuKeluar = Carbon::now();
        $biayaInfo = $this->tarifService->hitungBiaya($transaksi, $waktuKeluar);

        return response()->json([
            'id_parkir'            => $transaksi->id_parkir,
            'kode_tiket'           => $transaksi->kode_tiket,
            'plat_nomor'           => $transaksi->kendaraan->plat_nomor,
            'jenis_kendaraan'      => $transaksi->kendaraan->jenis_kendaraan,
            'nama_area'            => $transaksi->area->nama_area,
            'kode_slot'            => $transaksi->slot?->kode_slot ?? '-',
            'waktu_masuk'          => $transaksi->waktu_masuk->format('Y-m-d H:i:s'),
            'waktu_keluar'         => $waktuKeluar->format('Y-m-d H:i:s'),
            'durasi_jam'           => $biayaInfo['durasi_jam'],
            'tarif_per_jam'        => $biayaInfo['tarif_per_jam'],
            'biaya_total'          => $biayaInfo['biaya_total'],
            'biaya_total_formatted'=> 'Rp ' . number_format($biayaInfo['biaya_total'], 0, ',', '.'),
        ]);
    }

    public function prosesKeluar(Request $request)
    {
        $request->validate([
            'id_parkir'         => 'required|exists:tb_transaksi,id_parkir',
            'metode_pembayaran' => 'required|in:tunai,qris,transfer,kartu',
            'catatan'           => 'nullable|string|max:255',
        ]);

        try {
            $transaksi = $this->parkirService->prosesKeluar(
                idParkir: (int) $request->id_parkir,
                idPetugasKeluar: Auth::id(),
                metodePembayaran: $request->metode_pembayaran,
                catatan: $request->catatan
            );

            return redirect()->route('petugas.dashboard')
                ->with('success', "Kendaraan {$transaksi->kendaraan->plat_nomor} keluar. Total Biaya: Rp " . number_format($transaksi->biaya_total, 0, ',', '.') . " ({$request->metode_pembayaran})");
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function ajukanKoreksi(Request $request)
    {
        $request->validate([
            'id_parkir' => 'required|exists:tb_transaksi,id_parkir',
            'alasan'    => 'required|string|min:5|max:255',
        ]);

        try {
            $this->parkirService->ajukanKoreksi(
                idParkir: (int) $request->id_parkir,
                idPetugas: Auth::id(),
                alasan: $request->alasan
            );

            return back()->with('success', 'Permintaan koreksi transaksi telah diajukan ke Admin.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function penutupanShift(Request $request)
    {
        $request->validate([
            'waktu_mulai'       => 'required|date',
            'waktu_selesai'     => 'required|date|after_or_equal:waktu_mulai',
            'total_tunai_fisik' => 'required|numeric|min:0',
            'total_setoran'     => 'required|numeric|min:0',
            'bukti_setoran'     => 'nullable|string',
        ]);

        try {
            $shift = $this->shiftService->ajukanPenutupanShift(
                idPetugas: Auth::id(),
                data: $request->only(['waktu_mulai', 'waktu_selesai', 'total_tunai_fisik', 'total_setoran', 'bukti_setoran'])
            );

            $pesan = ($shift->status === 'perlu_pemeriksaan')
                ? "Laporan penutupan shift diajukan dengan status PERLU PEMERIKSAAN karena terdapat selisih Rp " . number_format($shift->selisih, 0, ',', '.')
                : "Laporan penutupan shift berhasil diajukan ke Admin.";

            return redirect()->route('petugas.dashboard')->with('success', $pesan);
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function riwayatShift()
    {
        $riwayat = PenutupanShift::where('id_petugas', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        $mapped = $riwayat->through(fn($s) => [
            'id_shift'                => $s->id_shift,
            'waktu_mulai'             => $s->waktu_mulai,
            'waktu_selesai'           => $s->waktu_selesai,
            'total_transaksi'         => $s->total_transaksi,
            'total_pendapatan_sistem' => $s->total_pendapatan_sistem,
            'total_tunai_fisik'       => $s->total_tunai_fisik,
            'total_setoran'           => $s->total_setoran,
            'selisih'                 => $s->selisih,
            'status'                  => $s->status,
            'catatan'                 => $s->catatan,
            'catatan_admin'           => $s->catatan_admin,
            'created_at'              => $s->created_at,
        ]);

        return Inertia::render('Petugas/RiwayatShift', [
            'riwayat' => $mapped,
        ]);
    }
}
