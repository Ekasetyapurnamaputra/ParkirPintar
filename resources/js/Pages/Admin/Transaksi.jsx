import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { appUrl } from '../../Utils/url';

export default function Transaksi({ transaksi, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [paymentFilter, setPaymentFilter] = useState(filters?.status_pembayaran || '');
    const [dateFilter, setDateFilter] = useState(filters?.tanggal || '');
    const [selectedKoreksi, setSelectedKoreksi] = useState(null);

    const koreksiForm = useForm({
        disetujui: true,
        catatan_admin: '',
    });

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(num) || 0);
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        router.get(appUrl('/admin/transaksi'), {
            search: searchTerm,
            status: statusFilter,
            status_pembayaran: paymentFilter,
            tanggal: dateFilter,
        }, { preserveState: true });
    };

    const openKoreksiModal = (t) => {
        setSelectedKoreksi(t);
        koreksiForm.setData({
            disetujui: true,
            catatan_admin: '',
        });
    };

    const submitKoreksi = (e) => {
        e.preventDefault();
        koreksiForm.post(appUrl(`/admin/transaksi/${selectedKoreksi.id_parkir}/koreksi`), {
            onSuccess: () => {
                setSelectedKoreksi(null);
                koreksiForm.reset();
            },
        });
    };

    return (
        <Layout title="Daftar Transaksi Parkir">
            <Head title="Transaksi Parkir - Parkir Pintar" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Daftar Transaksi Parkir</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Pencatatan sesi masuk-keluar kendaraan, audit biaya, dan persetujuan koreksi transaksi.
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <form onSubmit={handleFilterSubmit} className="mb-6 bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cari Tiket / Plat</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="cth: TKT- atau B 1234 CD"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status Sesi</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="masuk">Masuk (Sedang Parkir)</option>
                        <option value="keluar">Keluar (Selesai)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status Bayar</label>
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">Semua Pembayaran</option>
                        <option value="lunas">Lunas</option>
                        <option value="belum_lunas">Belum Lunas</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tanggal Masuk</label>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition"
                    >
                        Filter Data
                    </button>
                </div>
            </form>

            {/* Transaksi Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-4 py-3.5">Kode Tiket</th>
                                <th className="px-4 py-3.5">Plat Nomor</th>
                                <th className="px-4 py-3.5">Jenis</th>
                                <th className="px-4 py-3.5">Area & Slot</th>
                                <th className="px-4 py-3.5">Waktu Masuk / Keluar</th>
                                <th className="px-4 py-3.5">Biaya</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5 text-right">Koreksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {transaksi.data.map((t) => (
                                <tr key={t.id_parkir} className="hover:bg-slate-800/40 transition">
                                    <td className="px-4 py-3.5 font-mono text-amber-300 font-bold text-xs">{t.kode_tiket}</td>
                                    <td className="px-4 py-3.5 font-bold text-white uppercase">{t.plat_nomor}</td>
                                    <td className="px-4 py-3.5 capitalize text-xs">{t.jenis_kendaraan}</td>
                                    <td className="px-4 py-3.5 text-xs text-slate-400">
                                        <span>{t.nama_area}</span>
                                        {t.kode_slot && <span className="ml-1 text-amber-400 font-mono">({t.kode_slot})</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-400">
                                        <div>M: {t.waktu_masuk ? new Date(t.waktu_masuk).toLocaleString('id-ID') : '-'}</div>
                                        {t.waktu_keluar && (
                                            <div className="text-slate-500">
                                                K: {new Date(t.waktu_keluar).toLocaleString('id-ID')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-white">
                                        {formatRp(t.biaya_total)}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="space-y-1">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    t.status === 'masuk'
                                                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                                                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                                }`}
                                            >
                                                {t.status}
                                            </span>
                                            <span
                                                className={`inline-block ml-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    t.status_pembayaran === 'lunas'
                                                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                                        : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                                                }`}
                                            >
                                                {t.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        {t.status_koreksi === 'pending' ? (
                                            <button
                                                onClick={() => openKoreksiModal(t)}
                                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition"
                                            >
                                                Tinjau Koreksi
                                            </button>
                                        ) : t.status_koreksi ? (
                                            <span
                                                className={`text-[11px] font-semibold uppercase ${
                                                    t.status_koreksi === 'disetujui' ? 'text-emerald-400' : 'text-slate-500'
                                                }`}
                                            >
                                                Koreksi: {t.status_koreksi}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 text-xs">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {transaksi.links && transaksi.links.length > 3 && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Menampilkan {transaksi.from} - {transaksi.to} dari {transaksi.total} data
                        </div>
                        <div className="flex space-x-1">
                            {transaksi.links.map((link, idx) => (
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

            {/* Modal Tinjau Koreksi */}
            {selectedKoreksi && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Tinjau Pengajuan Koreksi</h3>
                            <button
                                onClick={() => setSelectedKoreksi(null)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Kode Tiket:</span>
                                <span className="font-mono font-bold text-amber-300">{selectedKoreksi.kode_tiket}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Plat Nomor:</span>
                                <span className="font-bold text-white">{selectedKoreksi.plat_nomor}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-700">
                                <span className="text-slate-400 block mb-0.5">Alasan Koreksi Petugas:</span>
                                <p className="text-slate-200 italic">{selectedKoreksi.alasan_koreksi}</p>
                            </div>
                        </div>

                        <form onSubmit={submitKoreksi} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Keputusan Admin
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => koreksiForm.setData('disetujui', true)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                                            koreksiForm.data.disetujui
                                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        ✓ Setujui Koreksi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => koreksiForm.setData('disetujui', false)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                                            !koreksiForm.data.disetujui
                                                ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        ✕ Tolak Koreksi
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Catatan / Alasan Keputusan Admin
                                </label>
                                <textarea
                                    value={koreksiForm.data.catatan_admin}
                                    onChange={(e) => koreksiForm.setData('catatan_admin', e.target.value)}
                                    placeholder="cth: Verifikasi kamera gerbang sesuai / tidak sesuai"
                                    rows="3"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedKoreksi(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={koreksiForm.processing}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                                >
                                    {koreksiForm.processing ? 'Menyimpan...' : 'Kirim Keputusan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

