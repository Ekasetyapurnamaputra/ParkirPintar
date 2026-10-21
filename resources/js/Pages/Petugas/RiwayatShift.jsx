import React from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function RiwayatShift({ riwayat }) {
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(num) || 0);
    };

    return (
        <Layout title="Riwayat Penutupan Shift">
            <Head title="Riwayat Shift - Parkir Pintar" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Riwayat Penutupan Shift Saya</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Daftar laporan shift kasir yang telah diajukan beserta status verifikasi administrator.
                    </p>
                </div>
            </div>

            {/* Shift History Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-4 py-3.5">ID Shift</th>
                                <th className="px-4 py-3.5">Periode Jam Kerja</th>
                                <th className="px-4 py-3.5">Transaksi Keluar</th>
                                <th className="px-4 py-3.5">Tagihan Sistem</th>
                                <th className="px-4 py-3.5">Kas Fisik</th>
                                <th className="px-4 py-3.5">Setoran</th>
                                <th className="px-4 py-3.5">Selisih Kas</th>
                                <th className="px-4 py-3.5">Status Verifikasi</th>
                                <th className="px-4 py-3.5">Catatan Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {riwayat.data.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-4 py-8 text-center text-slate-500 italic">
                                        Belum ada riwayat shift yang diajukan.
                                    </td>
                                </tr>
                            ) : (
                                riwayat.data.map((s) => (
                                    <tr key={s.id_shift} className="hover:bg-slate-800/40 transition">
                                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">#{s.id_shift}</td>
                                        <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                                            <div>{new Date(s.waktu_mulai).toLocaleString('id-ID')}</div>
                                            <div className="text-slate-500">s/d {new Date(s.waktu_selesai).toLocaleString('id-ID')}</div>
                                        </td>
                                        <td className="px-4 py-3.5 font-semibold text-slate-300">{s.total_transaksi} trx</td>
                                        <td className="px-4 py-3.5 font-mono text-amber-300 font-semibold">{formatRp(s.total_pendapatan_sistem)}</td>
                                        <td className="px-4 py-3.5 font-mono text-slate-200">{formatRp(s.total_tunai_fisik)}</td>
                                        <td className="px-4 py-3.5 font-mono text-emerald-400 font-semibold">{formatRp(s.total_setoran)}</td>
                                        <td className="px-4 py-3.5">
                                            <span
                                                className={`font-mono font-bold ${
                                                    s.selisih === 0 ? 'text-emerald-400' : 'text-rose-400'
                                                }`}
                                            >
                                                {formatRp(s.selisih)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    s.status === 'disetujui'
                                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                                        : s.status === 'ditolak'
                                                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                                        : s.status === 'perlu_pemeriksaan'
                                                        ? 'bg-red-950 text-red-300 border border-red-500/30'
                                                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                                }`}
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-400 italic">
                                            {s.catatan_admin || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {riwayat.links && riwayat.links.length > 3 && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Menampilkan {riwayat.from} - {riwayat.to} dari {riwayat.total} data
                        </div>
                        <div className="flex space-x-1">
                            {riwayat.links.map((link, idx) => (
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
        </Layout>
    );
}

