import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { appUrl } from '../../Utils/url';

export default function Shifts({ shifts }) {
    const [selectedShift, setSelectedShift] = useState(null);

    const reviewForm = useForm({
        disetujui: true,
        catatan: '',
    });

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(num) || 0);
    };

    const openReviewModal = (s) => {
        setSelectedShift(s);
        reviewForm.setData({
            disetujui: true,
            catatan: '',
        });
    };

    const submitReview = (e) => {
        e.preventDefault();
        reviewForm.post(appUrl(`/admin/shifts/${selectedShift.id_shift}/tinjau`), {
            onSuccess: () => {
                setSelectedShift(null);
                reviewForm.reset();
            },
        });
    };

    return (
        <Layout title="Penutupan Shift & Rekonsiliasi Kas">
            <Head title="Penutupan Shift - Parkir Pintar" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Laporan Penutupan Shift Petugas</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Pemeriksaan kepatuhan setoran kas fisik, audit selisih, dan pengesahan laporan shift.
                    </p>
                </div>
            </div>

            {/* Shifts Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-4 py-3.5">ID</th>
                                <th className="px-4 py-3.5">Petugas</th>
                                <th className="px-4 py-3.5">Periode Shift</th>
                                <th className="px-4 py-3.5">Transaksi</th>
                                <th className="px-4 py-3.5">Sistem</th>
                                <th className="px-4 py-3.5">Kas Fisik</th>
                                <th className="px-4 py-3.5">Setoran</th>
                                <th className="px-4 py-3.5">Selisih</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {shifts.data.map((s) => (
                                <tr key={s.id_shift} className="hover:bg-slate-800/40 transition">
                                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">#{s.id_shift}</td>
                                    <td className="px-4 py-3.5 font-bold text-white">{s.petugas}</td>
                                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                                        <div>{new Date(s.waktu_mulai).toLocaleString('id-ID')}</div>
                                        <div className="text-slate-500">s/d {new Date(s.waktu_selesai).toLocaleString('id-ID')}</div>
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-slate-300">{s.total_transaksi} trx</td>
                                    <td className="px-4 py-3.5 font-semibold text-amber-300">{formatRp(s.total_pendapatan_sistem)}</td>
                                    <td className="px-4 py-3.5 font-semibold text-slate-200">{formatRp(s.total_tunai_fisik)}</td>
                                    <td className="px-4 py-3.5 font-semibold text-emerald-400">{formatRp(s.total_setoran)}</td>
                                    <td className="px-4 py-3.5">
                                        <span
                                            className={`font-bold ${
                                                s.selisih === 0
                                                    ? 'text-emerald-400'
                                                    : 'text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/40'
                                            }`}
                                        >
                                            {formatRp(s.selisih)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                s.status === 'disetujui'
                                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                                    : s.status === 'ditolak'
                                                    ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                                                    : s.status === 'perlu_pemeriksaan'
                                                    ? 'bg-red-950 text-red-300 border border-red-500/30'
                                                    : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                            }`}
                                        >
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        {['diajukan', 'perlu_pemeriksaan'].includes(s.status) ? (
                                            <button
                                                onClick={() => openReviewModal(s)}
                                                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition"
                                            >
                                                Tinjau Laporan
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-500">
                                                Oleh: {s.pemeriksa || 'Admin'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {shifts.links && shifts.links.length > 3 && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Menampilkan {shifts.from} - {shifts.to} dari {shifts.total} data
                        </div>
                        <div className="flex space-x-1">
                            {shifts.links.map((link, idx) => (
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

            {/* Modal Tinjau Shift */}
            {selectedShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Tinjau Penutupan Shift #{selectedShift.id_shift}</h3>
                            <button
                                onClick={() => setSelectedShift(null)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Petugas:</span>
                                <span className="font-bold text-white">{selectedShift.petugas}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Transaksi Keluar:</span>
                                <span className="font-semibold text-slate-200">{selectedShift.total_transaksi} trx</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Tagihan Sistem:</span>
                                <span className="font-mono font-bold text-amber-300">{formatRp(selectedShift.total_pendapatan_sistem)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Kas Fisik Dihitung:</span>
                                <span className="font-mono font-bold text-slate-200">{formatRp(selectedShift.total_tunai_fisik)}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-700">
                                <span className="text-slate-400">Selisih Kas:</span>
                                <span className={`font-mono font-black ${selectedShift.selisih === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatRp(selectedShift.selisih)}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={submitReview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Keputusan Admin
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => reviewForm.setData('disetujui', true)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                                            reviewForm.data.disetujui
                                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        ✓ Sahkan & Terima
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => reviewForm.setData('disetujui', false)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                                            !reviewForm.data.disetujui
                                                ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        ✕ Tolak Laporan
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Catatan Verifikasi Admin
                                </label>
                                <textarea
                                    value={reviewForm.data.catatan}
                                    onChange={(e) => reviewForm.setData('catatan', e.target.value)}
                                    placeholder="cth: Kas fisik dan bukti setoran bank telah diverifikasi sesuai"
                                    rows="3"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedShift(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={reviewForm.processing}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                                >
                                    {reviewForm.processing ? 'Menyimpan...' : 'Simpan Verifikasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

