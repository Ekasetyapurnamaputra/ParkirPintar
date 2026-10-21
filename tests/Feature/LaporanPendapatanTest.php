<?php

namespace Tests\Feature;

use App\Models\AreaParkir;
use App\Models\Kendaraan;
use App\Models\Pembayaran;
use App\Models\Tarif;
use App\Models\Transaksi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class LaporanPendapatanTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Tanggal uji terisolasi agar tidak tersentuh data seed pada database test.
     */
    private const TANGGAL = '2019-06-15';

    /**
     * Buat satu transaksi beserta pembayaran lunas pada tanggal tertentu.
     */
    private function buatPembayaranLunas(
        Carbon $waktuBayar,
        float $nominal,
        string $metode = 'tunai',
        ?AreaParkir $area = null,
        string $jenisKendaraan = 'mobil'
    ): Transaksi {
        $area ??= AreaParkir::orderBy('id_area')->first();
        $admin = User::where('role', 'admin')->first();
        $tarif = Tarif::orderBy('id_tarif')->first();

        $kendaraan = Kendaraan::create([
            'plat_nomor'      => 'T' . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'jenis_kendaraan' => $jenisKendaraan,
            'warna'           => 'Hitam',
            'pemilik'         => 'Uji Otomatis',
            'id_user'         => $admin->id_user,
        ]);

        $transaksi = Transaksi::create([
            'kode_tiket'         => 'TST' . random_int(100000, 999999),
            'id_kendaraan'       => $kendaraan->id_kendaraan,
            'id_area'            => $area->id_area,
            'id_user'            => $admin->id_user,
            'id_petugas_keluar'  => $admin->id_user,
            'id_tarif'           => $tarif->id_tarif,
            'snapshot_tarif_per_jam' => 5000,
            'waktu_masuk'        => $waktuBayar->copy()->subHours(2),
            'waktu_keluar'       => $waktuBayar->copy(),
            'durasi_jam'         => 2,
            'biaya_total'        => $nominal,
            'status'             => 'keluar',
            'status_pembayaran' => 'lunas',
        ]);

        Pembayaran::create([
            'id_parkir'        => $transaksi->id_parkir,
            'kode_pembayaran' => 'PAY' . random_int(100000, 999999),
            'nominal'          => $nominal,
            'metode'           => $metode,
            'status'           => 'lunas',
            'waktu_bayar'      => $waktuBayar,
            'waktu_konfirmasi' => $waktuBayar,
            'id_petugas'       => $admin->id_user,
        ]);

        return $transaksi;
    }

    public function test_admin_dapat_mengakses_halaman_laporan_pendapatan(): void
    {
        $admin = User::where('role', 'admin')->first();

        $response = $this->actingAs($admin)->get(route('admin.pendapatan'));

        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Pendapatan')
            ->has('laporan.ringkasan')
            ->has('laporan.tren')
            ->has('laporan.per_jam')
            ->has('laporan.per_metode')
            ->has('laporan.per_area')
            ->has('laporan.per_jenis')
            ->has('laporan.rekap_harian')
            ->has('filter')
            ->has('areaOptions')
            ->has('metodeOptions')
        );
    }

    public function test_petugas_tidak_dapat_mengakses_halaman_laporan_pendapatan(): void
    {
        $petugas = User::where('role', 'petugas')->first();

        $this->actingAs($petugas)
            ->get(route('admin.pendapatan'))
            ->assertStatus(403);
    }

    public function test_laporan_menghitung_hanya_pembayaran_lunas(): void
    {
        $admin = User::where('role', 'admin')->first();
        $area = AreaParkir::orderBy('id_area')->first();
        $waktu = Carbon::parse(self::TANGGAL)->setTime(10, 30);

        $this->buatPembayaranLunas($waktu, 50000, 'tunai', $area, 'mobil');

        // Pembayaran belum lunas tidak boleh dihitung sebagai pendapatan.
        $kendaraan = Kendaraan::create([
            'plat_nomor'      => 'T999998',
            'jenis_kendaraan' => 'motor',
            'warna'           => 'Merah',
            'pemilik'         => 'Uji Otomatis',
            'id_user'         => $admin->id_user,
        ]);

        $transaksiBelumLunas = Transaksi::create([
            'kode_tiket'         => 'TST888888',
            'id_kendaraan'       => $kendaraan->id_kendaraan,
            'id_area'            => $area->id_area,
            'id_user'            => $admin->id_user,
            'id_tarif'           => Tarif::orderBy('id_tarif')->first()->id_tarif,
            'snapshot_tarif_per_jam' => 5000,
            'waktu_masuk'        => $waktu->copy()->subHour(),
            'waktu_keluar'       => $waktu->copy(),
            'durasi_jam'         => 1,
            'biaya_total'        => 75000,
            'status'             => 'keluar',
            'status_pembayaran' => 'belum_bayar',
        ]);

        Pembayaran::create([
            'id_parkir'        => $transaksiBelumLunas->id_parkir,
            'kode_pembayaran' => 'PAY888888',
            'nominal'          => 75000,
            'metode'           => 'qris',
            'status'           => 'menunggu',
            'waktu_bayar'      => $waktu->copy(),
            'id_petugas'       => $admin->id_user,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.pendapatan', [
            'dari'    => self::TANGGAL,
            'sampai' => self::TANGGAL,
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page
            ->where('laporan.ringkasan.total', 50000)
            ->where('laporan.ringkasan.transaksi', 1)
            ->where('laporan.tren.0.total', 50000)
            ->where('laporan.per_metode.0.total', 50000)
        );
    }

    public function test_filter_area_dan_metode_diterapkan(): void
    {
        $admin = User::where('role', 'admin')->first();
        $waktu = Carbon::parse(self::TANGGAL)->setTime(9, 15);

        $areaA = AreaParkir::orderBy('id_area')->first();
        $areaB = AreaParkir::orderByDesc('id_area')->first();

        $this->buatPembayaranLunas($waktu, 25000, 'tunai', $areaA, 'mobil');
        $this->buatPembayaranLunas($waktu, 35000, 'qris', $areaB, 'motor');

        // Filter area: hanya area A yang boleh masuk.
        $response = $this->actingAs($admin)->get(route('admin.pendapatan', [
            'dari'    => self::TANGGAL,
            'sampai' => self::TANGGAL,
            'area'    => $areaA->id_area,
        ]));

        $response->assertInertia(fn($page) => $page
            ->where('laporan.ringkasan.total', 25000)
            ->where('laporan.ringkasan.transaksi', 1)
            ->where('laporan.per_area.0.nama_area', $areaA->nama_area)
        );

        // Filter metode: hanya qris yang boleh masuk.
        $response = $this->actingAs($admin)->get(route('admin.pendapatan', [
            'dari'    => self::TANGGAL,
            'sampai' => self::TANGGAL,
            'metode'  => 'qris',
        ]));

        $response->assertInertia(fn($page) => $page
            ->where('laporan.ringkasan.total', 35000)
            ->where('laporan.ringkasan.transaksi', 1)
            ->where('laporan.per_metode.0.metode', 'qris')
        );
    }

    public function test_hari_tanpa_transaksi_diisi_nol(): void
    {
        $admin = User::where('role', 'admin')->first();

        $dari = Carbon::parse(self::TANGGAL)->subDays(2);
        $sampai = Carbon::parse(self::TANGGAL);

        $response = $this->actingAs($admin)->get(route('admin.pendapatan', [
            'dari'    => $dari->toDateString(),
            'sampai' => $sampai->toDateString(),
        ]));

        $response->assertInertia(fn($page) => $page
            ->has('laporan.tren', 3)
            ->where('laporan.tren.0.total', 0)
            ->where('laporan.tren.2.total', 0)
        );
    }

    public function test_jumlah_hari_periode_terhitung_bulat(): void
    {
        $admin = User::where('role', 'admin')->first();

        $dari = Carbon::parse(self::TANGGAL)->subDays(29);
        $sampai = Carbon::parse(self::TANGGAL);

        $response = $this->actingAs($admin)->get(route('admin.pendapatan', [
            'dari'    => $dari->toDateString(),
            'sampai' => $sampai->toDateString(),
        ]));

        $response->assertInertia(fn($page) => $page
            ->where('laporan.periode.jumlah_hari', 30)
            ->where('laporan.periode.mulai', $dari->toDateString())
            ->where('laporan.periode.selesai', $sampai->toDateString())
        );
    }

    public function test_parameter_tanggal_tidak_valid_ditolak(): void
    {
        $admin = User::where('role', 'admin')->first();

        $this->actingAs($admin)
            ->get(route('admin.pendapatan', ['dari' => 'bukan-tanggal']))
            ->assertSessionHasErrors('dari');
    }
}
