import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { appUrl } from '../../Utils/url';

export default function PetugasDashboard({
    areas = [],
    stats = {},
    sesiAktif,
    reservasiMenunggu = [],
    slotsTersedia = [],
    shiftPreview = {},
}) {
    // Check-in Form
    const checkinForm = useForm({
        plat_nomor: '',
        jenis_kendaraan: 'motor',
        id_area: areas[0]?.id_area || '',
        id_slot: '',
        warna: '',
        pemilik: '',
    });

    // Check-out State & Form
    const [checkoutKeyword, setCheckoutKeyword] = useState('');
    const [calcResult, setCalcResult] = useState(null);
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcError, setCalcError] = useState('');

    const checkoutForm = useForm({
        id_parkir: '',
        metode_pembayaran: 'tunai',
        catatan: '',
    });

    // Shift Closure Form
    const [shiftModalOpen, setShiftModalOpen] = useState(false);
    const shiftForm = useForm({
        waktu_mulai: shiftPreview?.waktu_mulai || new Date().toISOString().slice(0, 16),
        waktu_selesai: new Date().toISOString().slice(0, 16),
        total_tunai_fisik: '',
        total_setoran: '',
        bukti_setoran: '',
    });

    // Koreksi Form
    const [koreksiModalOpen, setKoreksiModalOpen] = useState(false);
    const [koreksiSession, setKoreksiSession] = useState(null);
    const koreksiForm = useForm({
        id_parkir: '',
        alasan: '',
    });

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(num) || 0);
    };

    // Filter available slots based on selected area
    const filteredSlots = slotsTersedia.filter(
        (s) => String(s.id_area) === String(checkinForm.data.id_area)
    );

    const submitCheckin = (e) => {
        e.preventDefault();
        checkinForm.post(appUrl('/petugas/masuk'), {
            onSuccess: () => {
                checkinForm.reset('plat_nomor', 'warna', 'pemilik');
            },
        });
    };

    const handleCalculateExit = async (e) => {
        e?.preventDefault();
        if (!checkoutKeyword.trim()) return;

        setCalcLoading(true);
        setCalcError('');
        setCalcResult(null);

        try {
            const res = await window.axios.get(appUrl(`/petugas/hitung-keluar?keyword=${encodeURIComponent(checkoutKeyword.trim())}`));
            setCalcResult(res.data);
            checkoutForm.setData('id_parkir', res.data.id_parkir);
        } catch (err) {
            setCalcError(err.response?.data?.error || 'Kendaraan tidak ditemukan atau sudah keluar.');
        } finally {
            setCalcLoading(false);
        }
    };

    const submitCheckout = (e) => {
        e.preventDefault();
        checkoutForm.post(appUrl('/petugas/keluar'), {
            onSuccess: () => {
                setCalcResult(null);
                setCheckoutKeyword('');
                checkoutForm.reset();
            },
        });
    };

    const openKoreksi = (sesi) => {
        setKoreksiSession(sesi);
        koreksiForm.setData({
            id_parkir: sesi.id_parkir,
            alasan: '',
        });
        setKoreksiModalOpen(true);
    };

    const submitKoreksi = (e) => {
        e.preventDefault();
        koreksiForm.post(appUrl('/petugas/koreksi'), {
            onSuccess: () => {
                setKoreksiModalOpen(false);
                koreksiForm.reset();
            },
        });
    };

    const submitShift = (e) => {
        e.preventDefault();
        shiftForm.post(appUrl('/petugas/shift'), {
            onSuccess: () => {
                setShiftModalOpen(false);
                shiftForm.reset();
            },
        });
    };

    return (
        <Layout title="Terminal Operasional Gerbang">
            <Head title="Terminal Petugas - Parkir Pintar" />

            {/* Header Section */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Terminal Operasional Gerbang</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Pencatatan kendaraan masuk, penghitungan tarif keluar, dan penutupan shift kasir.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShiftModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center space-x-2"
                    >
                        <span>📋</span>
                        <span>Tutup Shift Kasir</span>
                    </button>
                </div>
            </div>

            {/* Top Quick Status Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Kendaraan Parkir (Terisi)
                    </div>
                    <div className="mt-2 text-3xl font-black text-amber-400">
                        {stats.totalTerisi}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Dari {stats.totalKapasitas} kapasitas total
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Slot Kosong (Tersedia)
                    </div>
                    <div className="mt-2 text-3xl font-black text-emerald-400">
                        {stats.totalSlotTersedia}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Siap digunakan saat ini
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Transaksi Shift Anda
                    </div>
                    <div className="mt-2 text-2xl font-black text-blue-400">
                        {shiftPreview?.total_transaksi || 0} <span className="text-xs font-normal text-slate-400">kendaraan keluar</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Pada sesi aktif saat ini
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Estimasi Kas Tunai Shift
                    </div>
                    <div className="mt-2 text-xl font-black text-emerald-400 truncate">
                        {formatRp(shiftPreview?.total_tunai)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Total sistem: {formatRp(shiftPreview?.total_pendapatan)}
                    </div>
                </div>
            </div>

            {/* Split Dual Action Panel: Gerbang Masuk & Gerbang Keluar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 1. GERBANG MASUK (CHECK-IN) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
                            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                                IN
                            </span>
                            <div>
                                <h2 className="text-base font-bold text-white">Catat Kendaraan Masuk</h2>
                                <p className="text-xs text-slate-400">Cetak tiket gerbang masuk & alokasi slot</p>
                            </div>
                        </div>

                        <form onSubmit={submitCheckin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Nomor Polisi (Plat Nomor) *
                                </label>
                                <input
                                    type="text"
                                    value={checkinForm.data.plat_nomor}
                                    onChange={(e) => checkinForm.setData('plat_nomor', e.target.value.toUpperCase())}
                                    placeholder="cth: B 1234 CD"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-lg tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {checkinForm.errors.plat_nomor && (
                                    <p className="text-xs text-rose-400 mt-1">{checkinForm.errors.plat_nomor}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Jenis Kendaraan *
                                    </label>
                                    <select
                                        value={checkinForm.data.jenis_kendaraan}
                                        onChange={(e) => checkinForm.setData('jenis_kendaraan', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="motor">Motor</option>
                                        <option value="mobil">Mobil</option>
                                        <option value="lainnya">Lainnya / Truk</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Pilih Area Parkir *
                                    </label>
                                    <select
                                        value={checkinForm.data.id_area}
                                        onChange={(e) => checkinForm.setData('id_area', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        {areas.map((a) => (
                                            <option key={a.id_area} value={a.id_area}>
                                                {a.nama_area} (Sisa: {a.kapasitas - a.terisi})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Slot Spesifik (Opsional)
                                    </label>
                                    <select
                                        value={checkinForm.data.id_slot}
                                        onChange={(e) => checkinForm.setData('id_slot', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Otomatis / Bebas</option>
                                        {filteredSlots.map((s) => (
                                            <option key={s.id_slot} value={s.id_slot}>
                                                Slot {s.kode_slot}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Warna Kendaraan
                                    </label>
                                    <input
                                        type="text"
                                        value={checkinForm.data.warna}
                                        onChange={(e) => checkinForm.setData('warna', e.target.value)}
                                        placeholder="cth: Hitam"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={checkinForm.processing}
                                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
                            >
                                {checkinForm.processing ? 'Mencatat Masuk...' : '✓ Cetak Tiket & Buka Palang Masuk'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 2. GERBANG KELUAR (CHECK-OUT) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
                            <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-sm border border-rose-500/20">
                                OUT
                            </span>
                            <div>
                                <h2 className="text-base font-bold text-white">Proses Kendaraan Keluar</h2>
                                <p className="text-xs text-slate-400">Scan tiket / cari nomor plat & terima pembayaran</p>
                            </div>
                        </div>

                        {/* Search Bar for Exit */}
                        <form onSubmit={handleCalculateExit} className="mb-4 flex space-x-2">
                            <input
                                type="text"
                                value={checkoutKeyword}
                                onChange={(e) => setCheckoutKeyword(e.target.value.toUpperCase())}
                                placeholder="Scan / Masukkan Kode Tiket / Plat Nomor..."
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <button
                                type="submit"
                                disabled={calcLoading || !checkoutKeyword.trim()}
                                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition disabled:opacity-50 cursor-pointer"
                            >
                                {calcLoading ? 'Menghitung...' : 'Hitung Tarif'}
                            </button>
                        </form>

                        {calcError && (
                            <div className="p-3 mb-4 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-200 text-xs">
                                ⚠️ {calcError}
                            </div>
                        )}

                        {/* Calculation Breakdown Result */}
                        {calcResult && (
                            <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/30 space-y-3 mb-4">
                                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                                    <div>
                                        <span className="text-xs text-slate-400 block">Tiket Parkir:</span>
                                        <span className="font-mono font-bold text-amber-300 text-sm">{calcResult.kode_tiket}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 block">Plat Nomor:</span>
                                        <span className="font-bold text-white text-base">{calcResult.plat_nomor}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                                    <div>Area: <span className="text-white font-semibold">{calcResult.nama_area}</span></div>
                                    <div>Slot: <span className="text-amber-400 font-mono font-bold">{calcResult.kode_slot}</span></div>
                                    <div>Waktu Masuk: <span className="text-slate-400 block">{calcResult.waktu_masuk}</span></div>
                                    <div>Durasi Terhitung: <span className="text-amber-400 font-bold block">{calcResult.durasi_jam} Jam</span></div>
                                </div>

                                <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
                                    <span className="text-xs text-slate-400 font-semibold uppercase">Total Tagihan Parkir:</span>
                                    <span className="text-2xl font-black text-emerald-400">
                                        {calcResult.biaya_total_formatted}
                                    </span>
                                </div>

                                {/* Form Submit Pembayaran */}
                                <form onSubmit={submitCheckout} className="pt-3 border-t border-slate-700 space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                                            Metode Pembayaran *
                                        </label>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {['tunai', 'qris', 'transfer', 'kartu'].map((m) => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => checkoutForm.setData('metode_pembayaran', m)}
                                                    className={`py-1.5 rounded-lg text-xs font-bold uppercase transition border ${
                                                        checkoutForm.data.metode_pembayaran === m
                                                            ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                                                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                                                    }`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            value={checkoutForm.data.catatan}
                                            onChange={(e) => checkoutForm.setData('catatan', e.target.value)}
                                            placeholder="Catatan tambahan (opsional)..."
                                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={checkoutForm.processing}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-600/20 transition disabled:opacity-50 cursor-pointer"
                                    >
                                        {checkoutForm.processing ? 'Menyelesaikan Transaksi...' : '✓ Terima Bayar & Buka Palang Keluar'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Real-Time Active Parking Sessions Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg mb-8">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center space-x-2">
                            <span>🅿️</span>
                            <span>Daftar Kendaraan Sedang Parkir ({sesiAktif.total || sesiAktif.data?.length || 0})</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Estimasi durasi dan tagihan biaya terhitung otomatis secara real-time.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Tiket</th>
                                <th className="px-4 py-3">Plat Nomor</th>
                                <th className="px-4 py-3">Jenis</th>
                                <th className="px-4 py-3">Area & Slot</th>
                                <th className="px-4 py-3">Waktu Masuk</th>
                                <th className="px-4 py-3">Durasi</th>
                                <th className="px-4 py-3">Estimasi Biaya</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {sesiAktif.data.map((s) => (
                                <tr key={s.id_parkir} className="hover:bg-slate-800/40 transition">
                                    <td className="px-4 py-3 font-mono text-amber-300 font-bold text-xs">{s.kode_tiket}</td>
                                    <td className="px-4 py-3 font-bold text-white uppercase">{s.plat_nomor}</td>
                                    <td className="px-4 py-3 capitalize text-xs text-slate-400">{s.jenis_kendaraan}</td>
                                    <td className="px-4 py-3 text-xs">
                                        <span className="text-slate-300">{s.nama_area}</span>
                                        {s.kode_slot && <span className="ml-1 text-amber-400 font-mono font-bold">({s.kode_slot})</span>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{s.waktu_masuk}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-amber-400">{s.durasi_jam} jam</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-400">{formatRp(s.estimasi_biaya)}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button
                                            onClick={() => {
                                                setCheckoutKeyword(s.kode_tiket);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold transition"
                                        >
                                            Proses Keluar
                                        </button>
                                        <button
                                            onClick={() => openKoreksi(s)}
                                            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-xs font-semibold transition"
                                        >
                                            Koreksi
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {sesiAktif.links && sesiAktif.links.length > 3 && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Menampilkan {sesiAktif.from} - {sesiAktif.to} dari {sesiAktif.total} data
                        </div>
                        <div className="flex space-x-1">
                            {sesiAktif.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                        link.active
                                            ? 'bg-amber-500 text-slate-950'
                                            : !link.url
                                            ? 'text-slate-600 cursor-not-allowed'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Penutupan Shift */}
            {shiftModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Laporan Penutupan Shift Kasir</h3>
                            <button
                                onClick={() => setShiftModalOpen(false)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Transaksi Keluar Shift Ini:</span>
                                <span className="font-bold text-white">{shiftPreview?.total_transaksi || 0} kendaraan</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Tagihan Sistem:</span>
                                <span className="font-mono font-bold text-amber-300">{formatRp(shiftPreview?.total_pendapatan)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Estimasi Uang Tunai Masuk:</span>
                                <span className="font-mono font-bold text-emerald-400">{formatRp(shiftPreview?.total_tunai)}</span>
                            </div>
                        </div>

                        <form onSubmit={submitShift} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Waktu Mulai Shift
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={shiftForm.data.waktu_mulai}
                                        onChange={(e) => shiftForm.setData('waktu_mulai', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Waktu Selesai Shift
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={shiftForm.data.waktu_selesai}
                                        onChange={(e) => shiftForm.setData('waktu_selesai', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Total Uang Tunai Fisik di Laci Kasir (Rp) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={shiftForm.data.total_tunai_fisik}
                                    onChange={(e) => shiftForm.setData('total_tunai_fisik', e.target.value)}
                                    placeholder="cth: 150000"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {shiftForm.errors.total_tunai_fisik && (
                                    <p className="text-xs text-rose-400 mt-1">{shiftForm.errors.total_tunai_fisik}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Total Uang Yang Disetorkan ke Admin / Bank (Rp) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={shiftForm.data.total_setoran}
                                    onChange={(e) => shiftForm.setData('total_setoran', e.target.value)}
                                    placeholder="cth: 150000"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {shiftForm.errors.total_setoran && (
                                    <p className="text-xs text-rose-400 mt-1">{shiftForm.errors.total_setoran}</p>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShiftModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={shiftForm.processing}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                                >
                                    {shiftForm.processing ? 'Mengirim...' : 'Kirim Laporan Shift'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Ajukan Koreksi */}
            {koreksiModalOpen && koreksiSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Ajukan Koreksi Sesi Parkir</h3>
                            <button
                                onClick={() => setKoreksiModalOpen(false)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1">
                            <div>Tiket: <span className="font-mono font-bold text-amber-300">{koreksiSession.kode_tiket}</span></div>
                            <div>Plat: <span className="font-bold text-white">{koreksiSession.plat_nomor}</span></div>
                        </div>

                        <form onSubmit={submitKoreksi} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Alasan Koreksi Transaksi *
                                </label>
                                <textarea
                                    value={koreksiForm.data.alasan}
                                    onChange={(e) => koreksiForm.setData('alasan', e.target.value)}
                                    placeholder="cth: Salah input plat nomor saat gerbang masuk atau kartu tiket rusak..."
                                    rows="3"
                                    required
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                ></textarea>
                                {koreksiForm.errors.alasan && (
                                    <p className="text-xs text-rose-400 mt-1">{koreksiForm.errors.alasan}</p>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setKoreksiModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={koreksiForm.processing}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-md transition disabled:opacity-50"
                                >
                                    {koreksiForm.processing ? 'Mengirim...' : 'Ajukan ke Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

