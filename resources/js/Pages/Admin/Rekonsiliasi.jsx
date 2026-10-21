import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { appUrl } from '../../Utils/url';

export default function Rekonsiliasi({
    tanggal,
    totalMasuk,
    totalKeluar,
    totalTagihan,
    reservasiDipesan,
    reservasiSelesai,
    reservasiNoShow,
    reservasiBatal,
    pembayaranTunai,
    pembayaranNontunai,
    totalPembayaranSistem,
    shifts = [],
    totalTunaiFisik,
    totalSetoran,
    totalSelisih,
    anomali = [],
}) {
    const [selectedDate, setSelectedDate] = useState(tanggal);

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(num) || 0);
    };

    const handleDateChange = (e) => {
        const d = e.target.value;
        setSelectedDate(d);
        router.get(appUrl('/admin/rekonsiliasi'), { tanggal: d }, { preserveState: true });
    };

    return (
        <Layout title="Laporan Rekonsiliasi 3-Arah">
            <Head title="Rekonsiliasi Keuangan - Parkir Pintar" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Laporan Rekonsiliasi Tiga Arah</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Pencocokan silang antara catatan sesi gerbang fisik, tagihan transaksi, dan kas setoran shift.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-semibold">Pilih Tanggal:</span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-md"
                    />
                </div>
            </div>

            {/* Anomaly Alerts Banner */}
            {anomali.length > 0 ? (
                <div className="mb-6 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 shadow-xl">
                    <div className="flex items-center space-x-2 mb-2 font-bold text-sm text-rose-300">
                        <span>🚨</span>
                        <span>PERINGATAN: Ditemukan {anomali.length} Anomali Rekonsiliasi Pada Tanggal Ini!</span>
                    </div>
                    <ul className="list-disc list-inside text-xs space-y-1 text-rose-100">
                        {anomali.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 flex items-center space-x-3 shadow-lg">
                    <span className="text-xl">✅</span>
                    <div className="text-xs">
                        <span className="font-bold block text-sm text-emerald-300">Rekonsiliasi Seimbang</span>
                        Catatan sesi fisik gerbang, pembayaran kasir, dan penutupan shift berada dalam parameter wajar.
                    </div>
                </div>
            )}

            {/* 3 Columns Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Sumber 1: Sesi Operasional Parkir */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                1. Sesi Fisik Gerbang
                            </span>
                            <span className="text-xl">🚗</span>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Kendaraan Masuk:</span>
                                <span className="font-bold text-white">{totalMasuk} unit</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Kendaraan Keluar:</span>
                                <span className="font-bold text-white">{totalKeluar} unit</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-800">
                                <span className="text-slate-400">Total Tagihan Keluar:</span>
                                <span className="font-mono font-bold text-amber-300">{formatRp(totalTagihan)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                        Dihitung dari record sesi transaksi gerbang masuk dan keluar.
                    </div>
                </div>

                {/* Sumber 2: Arus Keuangan Pembayaran */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                2. Pembayaran Sistem
                            </span>
                            <span className="text-xl">💳</span>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Pembayaran Tunai:</span>
                                <span className="font-mono font-semibold text-slate-200">{formatRp(pembayaranTunai)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Pembayaran Nontunai (QRIS/Kartu):</span>
                                <span className="font-mono font-semibold text-slate-200">{formatRp(pembayaranNontunai)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-800">
                                <span className="text-slate-400">Total Penerimaan Sistem:</span>
                                <span className="font-mono font-black text-emerald-400">{formatRp(totalPembayaranSistem)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                        Berdasarkan tabel log pembayaran resmi yang terekam di sistem.
                    </div>
                </div>

                {/* Sumber 3: Laporan Kas Fisik Shift */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                3. Setoran Kas Fisik Shift
                            </span>
                            <span className="text-xl">💰</span>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Tunai Dihitung Petugas:</span>
                                <span className="font-mono font-semibold text-slate-200">{formatRp(totalTunaiFisik)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Setoran Kasir:</span>
                                <span className="font-mono font-semibold text-slate-200">{formatRp(totalSetoran)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-800">
                                <span className="text-slate-400">Net Selisih Kas:</span>
                                <span className={`font-mono font-black ${totalSelisih === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatRp(totalSelisih)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                        Agregasi seluruh laporan penutupan shift pada tanggal {selectedDate}.
                    </div>
                </div>
            </div>

            {/* Rincian Shift Hari Ini */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h2 className="text-base font-bold text-white mb-3">
                    Daftar Shift Petugas Terkait ({shifts.length} shift)
                </h2>
                {shifts.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                        Belum ada laporan penutupan shift yang diajukan untuk tanggal ini.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-800/60 uppercase font-semibold text-slate-400">
                                <tr>
                                    <th className="px-3 py-2">ID Shift</th>
                                    <th className="px-3 py-2">Kas Fisik</th>
                                    <th className="px-3 py-2">Setoran</th>
                                    <th className="px-3 py-2">Selisih</th>
                                    <th className="px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {shifts.map((s) => (
                                    <tr key={s.id_shift}>
                                        <td className="px-3 py-2.5 font-mono text-slate-400">#{s.id_shift}</td>
                                        <td className="px-3 py-2.5 font-mono">{formatRp(s.total_tunai_fisik)}</td>
                                        <td className="px-3 py-2.5 font-mono text-emerald-400">{formatRp(s.total_setoran)}</td>
                                        <td className="px-3 py-2.5 font-mono font-bold text-rose-400">{formatRp(s.selisih)}</td>
                                        <td className="px-3 py-2.5 uppercase font-semibold text-[10px] text-amber-300">{s.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}

