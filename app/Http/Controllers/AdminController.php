<?php

namespace App\Http\Controllers;

use App\Models\AreaParkir;
use App\Models\AuditLog;
use App\Models\Pembayaran;
use App\Models\Pengaturan;
use App\Models\PenutupanShift;
use App\Models\Reservasi;
use App\Models\SlotParkir;
use App\Models\Tarif;
use App\Models\Transaksi;
use App\Models\User;
use App\Services\AuditService;
use App\Services\LaporanPendapatanService;
use App\Services\ParkirService;
use App\Services\ShiftService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function __construct(
        protected ParkirService $parkirService,
        protected ShiftService $shiftService
    ) {}

    public function dashboard()
    {
        $totalKapasitas = AreaParkir::sum('kapasitas');
        $totalSlotTerisi = SlotParkir::where('status', 'terisi')->count();
        $totalSlotTersedia = SlotParkir::where('status', 'tersedia')->count();
        $totalSlotDipesan = SlotParkir::where('status', 'dipesan')->count();
        $totalSlotPerawatan = SlotParkir::where('status', 'perawatan')->count();

        $today = Carbon::today();
        $masukHariIni = Transaksi::whereDate('waktu_masuk', $today)->count();
        $keluarHariIni = Transaksi::whereDate('waktu_keluar', $today)->count();
        $sesiAktif = Transaksi::where('status', 'masuk')->count();

        $reservasiAktif = Reservasi::where('status', 'dipesan')->count();
        $reservasiNoShow = Reservasi::where('status', 'noshow')->count();

        // Revenue today
        $pendapatanTunaiHariIni = Pembayaran::where('status', 'lunas')
            ->where('metode', 'tunai')
            ->whereDate('waktu_bayar', $today)
            ->sum('nominal');

        $pendapatanNontunaiHariIni = Pembayaran::where('status', 'lunas')
            ->where('metode', '!=', 'tunai')
            ->whereDate('waktu_bayar', $today)
            ->sum('nominal');

        $totalPendapatanHariIni = $pendapatanTunaiHariIni + $pendapatanNontunaiHariIni;

        // Pending items
        $shiftMenunggu = PenutupanShift::with('petugas')
            ->whereIn('status', ['diajukan', 'perlu_pemeriksaan'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($s) => [
                'id_shift'    => $s->id_shift,
                'petugas'     => $s->petugas?->nama_lengkap,
                'waktu_mulai' => $s->waktu_mulai,
                'status'      => $s->status,
                'selisih'     => $s->selisih,
            ]);

        $koreksiMenunggu = Transaksi::with(['kendaraan', 'petugasMasuk', 'petugasKeluar'])
            ->where('status_koreksi', 'pending')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn($t) => [
                'id_parkir'    => $t->id_parkir,
                'kode_tiket'   => $t->kode_tiket,
                'plat_nomor'   => $t->kendaraan?->plat_nomor,
                'alasan_koreksi' => $t->alasan_koreksi,
                'updated_at'   => $t->updated_at,
            ]);

        // Discrepancy alerts
        $shiftAnomali = PenutupanShift::with('petugas')
            ->where('status', 'perlu_pemeriksaan')
            ->orWhere('selisih', '!=', 0)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'id_shift'    => $s->id_shift,
                'petugas'     => $s->petugas?->nama_lengkap,
                'waktu_mulai' => $s->waktu_mulai,
                'status'      => $s->status,
                'selisih'     => $s->selisih,
            ]);

        // Recent Audit logs
        $recentAudit = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(fn($l) => [
                'id_log'     => $l->id_log,
                'aksi'       => $l->aksi,
                'tabel'      => $l->tabel,
                'alasan'     => $l->alasan,
                'user'       => $l->user?->nama_lengkap,
                'created_at' => $l->created_at,
            ]);

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

        // Tren pendapatan 7 hari terakhir untuk grafik ringkas pada dashboard
        $laporanService = app(LaporanPendapatanService::class);
        $trenPendapatan = $laporanService->laporan(
            Carbon::today()->subDays(6),
            Carbon::today()
        )['tren'];

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalKapasitas'            => $totalKapasitas,
                'totalSlotTerisi'           => $totalSlotTerisi,
                'totalSlotTersedia'         => $totalSlotTersedia,
                'totalSlotDipesan'          => $totalSlotDipesan,
                'totalSlotPerawatan'        => $totalSlotPerawatan,
                'masukHariIni'              => $masukHariIni,
                'keluarHariIni'             => $keluarHariIni,
                'sesiAktif'                 => $sesiAktif,
                'reservasiAktif'            => $reservasiAktif,
                'reservasiNoShow'           => $reservasiNoShow,
                'pendapatanTunaiHariIni'    => $pendapatanTunaiHariIni,
                'pendapatanNontunaiHariIni' => $pendapatanNontunaiHariIni,
                'totalPendapatanHariIni'    => $totalPendapatanHariIni,
            ],
            'shiftMenunggu'   => $shiftMenunggu,
            'koreksiMenunggu' => $koreksiMenunggu,
            'shiftAnomali'    => $shiftAnomali,
            'recentAudit'     => $recentAudit,
            'areas'           => $areas,
            'trenPendapatan'  => $trenPendapatan,
        ]);
    }

    public function users(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('nama_lengkap', 'like', "%{$s}%")
                  ->orWhere('username', 'like', "%{$s}%");
            });
        }

        $users = $query->orderBy('id_user', 'asc')->paginate(15)->withQueryString();

        return Inertia::render('Admin/Users', [
            'users'   => $users,
            'filters' => $request->only(['role', 'search']),
        ]);
    }

    public function createUser(Request $request)
    {
        $request->validate([
            'nama_lengkap' => 'required|string|max:50',
            'username'     => 'required|string|max:50|unique:tb_user,username',
            'password'     => 'required|string|min:6',
            'role'         => 'required|in:admin,petugas,owner',
        ]);

        $user = User::create([
            'nama_lengkap' => $request->nama_lengkap,
            'username'     => strtolower(trim($request->username)),
            'password'     => Hash::make($request->password),
            'role'         => $request->role,
            'status_aktif' => 1,
        ]);

        AuditService::log(
            aksi: 'USER_CREATE',
            tabel: 'tb_user',
            idRecord: (string) $user->id_user,
            dataBaru: ['nama_lengkap' => $user->nama_lengkap, 'username' => $user->username, 'role' => $user->role],
            alasan: "Admin membuat user baru: {$user->username} ({$user->role})"
        );

        return back()->with('success', "Pengguna {$user->username} ({$user->role}) berhasil dibuat!");
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'nama_lengkap' => 'required|string|max:50',
            'username'     => "required|string|max:50|unique:tb_user,username,{$user->id_user},id_user",
            'role'         => 'required|in:admin,petugas,owner',
            'password'     => 'nullable|string|min:6',
        ]);

        $old = $user->toArray();

        $user->nama_lengkap = $request->nama_lengkap;
        $user->username     = strtolower(trim($request->username));
        $user->role         = $request->role;
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        AuditService::log(
            aksi: 'USER_UPDATE',
            tabel: 'tb_user',
            idRecord: (string) $user->id_user,
            dataLama: ['nama_lengkap' => $old['nama_lengkap'], 'username' => $old['username'], 'role' => $old['role']],
            dataBaru: ['nama_lengkap' => $user->nama_lengkap, 'username' => $user->username, 'role' => $user->role],
            alasan: "Admin memperbarui data pengguna: {$user->username}"
        );

        return back()->with('success', "Data pengguna {$user->username} berhasil diperbarui.");
    }

    public function toggleUserStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent admin from deactivating themselves
        if ($user->id_user === Auth::id()) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        $oldStatus = $user->status_aktif;
        $user->status_aktif = !$oldStatus;
        $user->save();

        AuditService::log(
            aksi: 'USER_STATUS_CHANGE',
            tabel: 'tb_user',
            idRecord: (string) $user->id_user,
            dataLama: ['status_aktif' => $oldStatus],
            dataBaru: ['status_aktif' => $user->status_aktif],
            alasan: "Status pengguna {$user->username} diubah menjadi: " . ($user->status_aktif ? 'Aktif' : 'Nonaktif')
        );

        return back()->with('success', "Status pengguna {$user->username} berhasil diubah.");
    }

    public function slots()
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

        return Inertia::render('Admin/Slots', [
            'areas' => $areas,
        ]);
    }

    public function updateSlotStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:tersedia,perawatan,tidak_aktif',
        ]);

        $slot = SlotParkir::findOrFail($id);
        if (in_array($slot->status, ['terisi', 'dipesan'])) {
            return back()->with('error', "Slot {$slot->kode_slot} sedang {$slot->status} dan tidak dapat diubah statusnya secara manual.");
        }

        $old = $slot->status;
        $slot->status = $request->status;
        $slot->save();

        AuditService::log(
            aksi: 'SLOT_STATUS_CHANGE',
            tabel: 'tb_slot_parkir',
            idRecord: (string) $slot->id_slot,
            dataLama: ['status' => $old],
            dataBaru: ['status' => $slot->status],
            alasan: "Admin mengubah status slot {$slot->kode_slot} dari {$old} menjadi {$slot->status}"
        );

        return back()->with('success', "Status slot {$slot->kode_slot} berhasil diubah.");
    }

    public function tarifs()
    {
        $tarifs   = Tarif::all();
        $settings = Pengaturan::all();

        return Inertia::render('Admin/Tarifs', [
            'tarifs'   => $tarifs,
            'settings' => $settings,
        ]);
    }

    public function updateTarif(Request $request, $id)
    {
        $request->validate([
            'tarif_per_jam' => 'required|numeric|min:0',
        ]);

        $tarif = Tarif::findOrFail($id);
        $old   = $tarif->toArray();

        $tarif->tarif_per_jam = $request->tarif_per_jam;
        $tarif->save();

        AuditService::log(
            aksi: 'TARIF_UPDATE',
            tabel: 'tb_tarif',
            idRecord: (string) $tarif->id_tarif,
            dataLama: $old,
            dataBaru: $tarif->toArray(),
            alasan: "Admin memperbarui tarif {$tarif->jenis_kendaraan} menjadi Rp " . number_format($tarif->tarif_per_jam, 0, ',', '.') . " per jam"
        );

        return back()->with('success', "Tarif {$tarif->jenis_kendaraan} berhasil diperbarui.");
    }

    public function updateSetting(Request $request)
    {
        $request->validate([
            'kunci' => 'required|exists:tb_pengaturan,kunci',
            'nilai' => 'required|string',
        ]);

        $setting = Pengaturan::where('kunci', $request->kunci)->firstOrFail();
        $old     = $setting->nilai;
        $setting->nilai = $request->nilai;
        $setting->save();

        AuditService::log(
            aksi: 'SETTING_UPDATE',
            tabel: 'tb_pengaturan',
            idRecord: (string) $setting->id_setting,
            dataLama: ['nilai' => $old],
            dataBaru: ['nilai' => $setting->nilai],
            alasan: "Admin memperbarui pengaturan {$setting->kunci} menjadi {$setting->nilai}"
        );

        return back()->with('success', "Pengaturan berhasil diperbarui.");
    }

    public function transaksi(Request $request)
    {
        $query = Transaksi::with(['kendaraan', 'area', 'slot', 'petugasMasuk', 'petugasKeluar', 'pembayaran']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('status_pembayaran')) {
            $query->where('status_pembayaran', $request->status_pembayaran);
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('waktu_masuk', $request->tanggal);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('kode_tiket', 'like', "%{$s}%")
                  ->orWhereHas('kendaraan', function ($k) use ($s) {
                      $k->where('plat_nomor', 'like', "%{$s}%");
                  });
            });
        }

        $transaksi = $query->orderBy('waktu_masuk', 'desc')->paginate(15)->withQueryString();

        // Map to clean props
        $mapped = $transaksi->through(fn($t) => [
            'id_parkir'        => $t->id_parkir,
            'kode_tiket'       => $t->kode_tiket,
            'plat_nomor'       => $t->kendaraan?->plat_nomor,
            'jenis_kendaraan'  => $t->kendaraan?->jenis_kendaraan,
            'nama_area'        => $t->area?->nama_area,
            'kode_slot'        => $t->slot?->kode_slot,
            'waktu_masuk'      => $t->waktu_masuk,
            'waktu_keluar'     => $t->waktu_keluar,
            'biaya_total'      => $t->biaya_total,
            'status'           => $t->status,
            'status_pembayaran' => $t->status_pembayaran,
            'status_koreksi'   => $t->status_koreksi,
            'alasan_koreksi'   => $t->alasan_koreksi,
            'petugas_masuk'    => $t->petugasMasuk?->nama_lengkap,
            'petugas_keluar'   => $t->petugasKeluar?->nama_lengkap,
        ]);

        return Inertia::render('Admin/Transaksi', [
            'transaksi' => $mapped,
            'filters'   => $request->only(['status', 'status_pembayaran', 'tanggal', 'search']),
        ]);
    }

    /**
     * Laporan & grafik pendapatan.
     *
     * Filter: rentang tanggal (`dari`, `sampai`), area parkir, dan metode pembayaran.
     */
    public function pendapatan(Request $request, LaporanPendapatanService $laporanService)
    {
        $validated = $request->validate([
            'dari'    => 'nullable|date',
            'sampai' => 'nullable|date',
            'area'   => 'nullable|integer',
            'metode' => 'nullable|string|in:tunai,qris,transfer,kartu',
        ]);

        $dari = $validated['dari'] ?? Carbon::today()->subDays(29)->toDateString();
        $sampai = $validated['sampai'] ?? Carbon::today()->toDateString();

        // Jaga agar rentang tidak terbalik dan dibatasi maksimal 366 hari.
        $mulai = Carbon::parse($dari)->startOfDay();
        $selesai = Carbon::parse($sampai)->startOfDay();

        if ($selesai->lt($mulai)) {
            [$mulai, $selesai] = [$selesai, $mulai];
        }

        if ($mulai->diffInDays($selesai) > 365) {
            $mulai = $selesai->copy()->subDays(365);
        }

        $filter = array_filter([
            'area'   => $validated['area'] ?? null,
            'metode' => $validated['metode'] ?? null,
        ], fn($v) => $v !== null && $v !== '');

        $data = $laporanService->laporan($mulai, $selesai, $filter);

        return Inertia::render('Admin/Pendapatan', [
            'laporan'      => $data,
            'filter'       => [
                'dari'    => $mulai->toDateString(),
                'sampai' => $selesai->toDateString(),
                'area'   => $filter['area'] ?? '',
                'metode' => $filter['metode'] ?? '',
            ],
            'areaOptions'  => $laporanService->areaOptions(),
            'metodeOptions' => $laporanService->metodeOptions(),
        ]);
    }

    public function tanganiKoreksi(Request $request, $id)
    {
        $request->validate([
            'disetujui'    => 'required|boolean',
            'catatan_admin' => 'nullable|string|max:255',
        ]);

        try {
            $this->parkirService->tanganiKoreksi(
                idParkir: (int) $id,
                idAdmin: Auth::id(),
                disetujui: $request->boolean('disetujui'),
                catatanAdmin: $request->catatan_admin
            );

            return back()->with('success', 'Status koreksi transaksi berhasil diperbarui.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function shifts()
    {
        $shifts = PenutupanShift::with(['petugas', 'pemeriksa'])
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $mapped = $shifts->through(fn($s) => [
            'id_shift'        => $s->id_shift,
            'petugas'         => $s->petugas?->nama_lengkap,
            'pemeriksa'       => $s->pemeriksa?->nama_lengkap,
            'waktu_mulai'     => $s->waktu_mulai,
            'waktu_selesai'   => $s->waktu_selesai,
            'total_transaksi' => $s->total_transaksi,
            'total_pendapatan_sistem' => $s->total_pendapatan_sistem,
            'total_tunai_fisik' => $s->total_tunai_fisik,
            'total_setoran'   => $s->total_setoran,
            'selisih'         => $s->selisih,
            'status'          => $s->status,
            'catatan'         => $s->catatan,
            'catatan_admin'   => $s->catatan_admin,
            'created_at'      => $s->created_at,
        ]);

        return Inertia::render('Admin/Shifts', [
            'shifts' => $mapped,
        ]);
    }

    public function tinjauShift(Request $request, $id)
    {
        $request->validate([
            'disetujui' => 'required|boolean',
            'catatan'   => 'nullable|string|max:255',
        ]);

        try {
            $this->shiftService->tinjauPenutupanShift(
                idShift: (int) $id,
                idAdmin: Auth::id(),
                disetujui: $request->boolean('disetujui'),
                catatan: $request->catatan
            );

            return back()->with('success', 'Keputusan penutupan shift berhasil disimpan.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function rekonsiliasi(Request $request)
    {
        $tanggal = $request->filled('tanggal') ? Carbon::parse($request->tanggal) : Carbon::today();

        // 1. Transaction stats on date
        $totalMasuk   = Transaksi::whereDate('waktu_masuk', $tanggal)->count();
        $totalKeluar  = Transaksi::whereDate('waktu_keluar', $tanggal)->where('status', 'keluar')->count();
        $totalTagihan = Transaksi::whereDate('waktu_keluar', $tanggal)->where('status', 'keluar')->sum('biaya_total');

        // 2. Reservations on date
        $reservasiDipesan = Reservasi::whereDate('jadwal_kedatangan', $tanggal)->count();
        $reservasiSelesai = Reservasi::whereDate('jadwal_kedatangan', $tanggal)->where('status', 'selesai')->count();
        $reservasiNoShow  = Reservasi::whereDate('jadwal_kedatangan', $tanggal)->where('status', 'noshow')->count();
        $reservasiBatal   = Reservasi::whereDate('jadwal_kedatangan', $tanggal)->where('status', 'dibatalkan')->count();

        // 3. Financial payments on date
        $pembayaranTunai    = Pembayaran::whereDate('waktu_bayar', $tanggal)->where('metode', 'tunai')->where('status', 'lunas')->sum('nominal');
        $pembayaranNontunai = Pembayaran::whereDate('waktu_bayar', $tanggal)->where('metode', '!=', 'tunai')->where('status', 'lunas')->sum('nominal');
        $totalPembayaranSistem = $pembayaranTunai + $pembayaranNontunai;

        // 4. Physical cash & deposits from shift reports on date
        $shifts         = PenutupanShift::whereDate('waktu_mulai', $tanggal)->get();
        $totalTunaiFisik = $shifts->sum('total_tunai_fisik');
        $totalSetoran   = $shifts->sum('total_setoran');
        $totalSelisih   = $shifts->sum('selisih');

        // Anomaly checks
        $anomali = [];
        if ($totalKeluar > 0 && $totalPembayaranSistem < $totalTagihan) {
            $anomali[] = "Total pembayaran sistem (Rp " . number_format($totalPembayaranSistem, 0, ',', '.') . ") lebih kecil dari total tagihan keluar (Rp " . number_format($totalTagihan, 0, ',', '.') . ").";
        }
        if ($shifts->count() > 0 && abs($totalSelisih) > 0) {
            $anomali[] = "Terdapat selisih kas fisik shift sebesar Rp " . number_format($totalSelisih, 0, ',', '.') . " yang dilaporkan petugas.";
        }

        return Inertia::render('Admin/Rekonsiliasi', [
            'tanggal'              => $tanggal->format('Y-m-d'),
            'totalMasuk'           => $totalMasuk,
            'totalKeluar'          => $totalKeluar,
            'totalTagihan'         => $totalTagihan,
            'reservasiDipesan'     => $reservasiDipesan,
            'reservasiSelesai'     => $reservasiSelesai,
            'reservasiNoShow'      => $reservasiNoShow,
            'reservasiBatal'       => $reservasiBatal,
            'pembayaranTunai'      => $pembayaranTunai,
            'pembayaranNontunai'   => $pembayaranNontunai,
            'totalPembayaranSistem' => $totalPembayaranSistem,
            'shifts'               => $shifts->map(fn($s) => [
                'id_shift'        => $s->id_shift,
                'total_tunai_fisik' => $s->total_tunai_fisik,
                'total_setoran'   => $s->total_setoran,
                'selisih'         => $s->selisih,
                'status'          => $s->status,
            ]),
            'totalTunaiFisik'      => $totalTunaiFisik,
            'totalSetoran'         => $totalSetoran,
            'totalSelisih'         => $totalSelisih,
            'anomali'              => $anomali,
        ]);
    }

    public function auditLogs(Request $request)
    {
        $query = AuditLog::with('user');

        if ($request->filled('aksi')) {
            $query->where('aksi', $request->aksi);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('alasan', 'like', "%{$s}%")
                  ->orWhere('tabel', 'like', "%{$s}%")
                  ->orWhere('id_record', 'like', "%{$s}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        $mapped = $logs->through(fn($l) => [
            'id_log'     => $l->id_log,
            'aksi'       => $l->aksi,
            'tabel'      => $l->tabel,
            'id_record'  => $l->id_record,
            'alasan'     => $l->alasan,
            'status_hasil' => $l->status_hasil,
            'data_lama'  => $l->data_lama,
            'data_baru'  => $l->data_baru,
            'user'       => $l->user?->nama_lengkap,
            'ip_address' => $l->ip_address,
            'created_at' => $l->created_at,
        ]);

        $distinctAksi = AuditLog::select('aksi')->distinct()->orderBy('aksi')->pluck('aksi');

        return Inertia::render('Admin/AuditLogs', [
            'logs'        => $mapped,
            'distinctAksi' => $distinctAksi,
            'filters'     => $request->only(['aksi', 'search']),
        ]);
    }
}
