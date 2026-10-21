import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { appUrl } from '../../Utils/url';

export default function AuditLogs({ logs, distinctAksi = [], filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [actionFilter, setActionFilter] = useState(filters?.aksi || '');
    const [selectedLog, setSelectedLog] = useState(null);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        router.get(appUrl('/admin/audit-logs'), {
            search: searchTerm,
            aksi: actionFilter,
        }, { preserveState: true });
    };

    return (
        <Layout title="Audit Log Terstruktur">
            <Head title="Audit Log - Parkir Pintar" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Log Audit Sistem Terstruktur</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Rekam jejak forensik immutable atas perubahan data transaksi, konfigurasi tarif, dan operasional.
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <form onSubmit={handleFilterSubmit} className="mb-6 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full sm:w-auto">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari alasan, tabel, atau ID record..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                <div className="w-full sm:w-64">
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">Semua Jenis Aksi</option>
                        {distinctAksi.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition"
                >
                    Filter Log
                </button>
            </form>

            {/* Audit Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-4 py-3.5">Waktu Kejadian</th>
                                <th className="px-4 py-3.5">Aksi</th>
                                <th className="px-4 py-3.5">Tabel Target</th>
                                <th className="px-4 py-3.5">Record</th>
                                <th className="px-4 py-3.5">Petugas / Aktor</th>
                                <th className="px-4 py-3.5">Alasan / Keterangan</th>
                                <th className="px-4 py-3.5 text-right">Snapshot</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {logs.data.map((l) => (
                                <tr key={l.id_log} className="hover:bg-slate-800/40 transition">
                                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                                        {new Date(l.created_at).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 border border-slate-700 text-amber-300">
                                            {l.aksi}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{l.tabel}</td>
                                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">#{l.id_record || '-'}</td>
                                    <td className="px-4 py-3.5 font-semibold text-slate-200 text-xs">
                                        {l.user || 'Sistem Otomatis'}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-300">{l.alasan}</td>
                                    <td className="px-4 py-3.5 text-right">
                                        {(l.data_lama || l.data_baru) ? (
                                            <button
                                                onClick={() => setSelectedLog(l)}
                                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold transition"
                                            >
                                                Lihat JSON
                                            </button>
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
                {logs.links && logs.links.length > 3 && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Menampilkan {logs.from} - {logs.to} dari {logs.total} data
                        </div>
                        <div className="flex space-x-1">
                            {logs.links.map((link, idx) => (
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

            {/* Modal Snapshot JSON */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-bold text-white">
                                    Snapshot Forensik: <span className="font-mono text-amber-400">{selectedLog.aksi}</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Tabel: {selectedLog.tabel} | Record: #{selectedLog.id_record || '-'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto mb-4">
                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                <span className="text-xs font-bold text-rose-400 block mb-2 uppercase tracking-wider">
                                    Snapshot Data Sebelum (Data Lama)
                                </span>
                                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
                                    {selectedLog.data_lama ? JSON.stringify(selectedLog.data_lama, null, 2) : '(Kosong / Tidak Tersedia)'}
                                </pre>
                            </div>

                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                <span className="text-xs font-bold text-emerald-400 block mb-2 uppercase tracking-wider">
                                    Snapshot Data Sesudah (Data Baru)
                                </span>
                                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
                                    {selectedLog.data_baru ? JSON.stringify(selectedLog.data_baru, null, 2) : '(Kosong / Tidak Tersedia)'}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

