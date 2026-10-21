import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { ChartCard, TrenAreaChart } from '../../Components/Charts';
import { appUrl } from '../../Utils/url';

export default function AdminDashboard({
    stats,
    shiftMenunggu = [],
    koreksiMenunggu = [],
    shiftAnomali = [],
    recentAudit = [],
    areas = [],
    trenPendapatan = [],
}) {
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(num) || 0);
    };

    return (
        <Layout title="Admin Dashboard">
            <Head title="Admin Dashboard - Parkir Pintar" />

            {/* Header Section */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        Dashboard Eksekutif & Pengawasan
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Monitoring okupansi slot parkir, arus keuangan, audit log, dan persetujuan shift.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        href={appUrl('/admin/rekonsiliasi')}
                        className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                    >
                        <span>📊 Rekonsiliasi 3-Arah</span>
                    </Link>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Sesi Parkir Aktif
                    </div>
                    <div className="mt-2 text-3xl font-black text-amber-400">
                        {stats.sesiAktif}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Kapasitas total: {stats.totalKapasitas} slot
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Slot Tersedia
                    </div>
                    <div className="mt-2 text-3xl font-black text-emerald-400">
                        {stats.totalSlotTersedia}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Terisi: {stats.totalSlotTerisi} | Dipesan: {stats.totalSlotDipesan}
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Trafik Hari Ini
                    </div>
                    <div className="mt-2 text-2xl font-black text-blue-400">
                        +{stats.masukHariIni} <span className="text-sm font-normal text-slate-400">/ -{stats.keluarHariIni}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Masuk / Keluar terekam
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Pendapatan Hari Ini
                    </div>
                    <div className="mt-2 text-xl font-black text-emerald-400 truncate">
                        {formatRp(stats.totalPendapatanHariIni)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Tunai: {formatRp(stats.pendapatanTunaiHariIni)}
                    </div>
                </div>
            </div>

            {/* Action Required: Urgent Warnings & Pending Tasks */}
            {(shiftMenunggu.length > 0 || koreksiMenunggu.length > 0 || shiftAnomali.length > 0) && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Shift Menunggu Persetujuan */}
                    {shiftMenunggu.length > 0 && (
                        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-amber-400 uppercase flex items-center space-x-1">
                                    <span>⏳</span>
                                    <span>Persetujuan Shift ({shiftMenunggu.length})</span>
                                </span>
                                <Link href={appUrl('/admin/shifts')} className="text-xs text-amber-300 hover:underline">
                                    Lihat Semua &rarr;
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {shiftMenunggu.slice(0, 3).map((s) => (
                                    <div key={s.id_shift} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                                        <div className="flex justify-between font-semibold text-slate-200">
                                            <span>{s.petugas}</span>
                                            <span className={s.selisih !== 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                                Selisih: {formatRp(s.selisih)}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Status: <span className="text-amber-300 uppercase font-semibold">{s.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Koreksi Transaksi */}
                    {koreksiMenunggu.length > 0 && (
                        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-rose-400 uppercase flex items-center space-x-1">
                                    <span>🚨</span>
                                    <span>Koreksi Transaksi ({koreksiMenunggu.length})</span>
                                </span>
                                <Link href={appUrl('/admin/transaksi')} className="text-xs text-rose-300 hover:underline">
                                    Periksa &rarr;
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {koreksiMenunggu.slice(0, 3).map((k) => (
                                    <div key={k.id_parkir} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                                        <div className="flex justify-between font-semibold text-slate-200">
                                            <span>{k.plat_nomor || k.kode_tiket}</span>
                                            <span className="text-rose-400 font-bold">Koreksi Diajukan</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                            {k.alasan_koreksi}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shift Anomali / Selisih */}
                    {shiftAnomali.length > 0 && (
                        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-red-400 uppercase flex items-center space-x-1">
                                    <span>⚠️</span>
                                    <span>Deteksi Selisih Kas</span>
                                </span>
                                <Link href={appUrl('/admin/shifts')} className="text-xs text-red-300 hover:underline">
                                    Audit &rarr;
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {shiftAnomali.slice(0, 3).map((a) => (
                                    <div key={a.id_shift} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                                        <div className="flex justify-between font-semibold text-slate-200">
                                            <span>{a.petugas}</span>
                                            <span className="text-red-400 font-bold">{formatRp(a.selisih)}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Perlu investigasi setoran kas fisik
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Grafik Tren Pendapatan 7 Hari */}
            <ChartCard
                title="Tren Pendapatan 7 Hari Terakhir"
                subtitle="Total pendapatan harian dari pembayaran lunas"
                icon="📈"
                className="mb-6"
                action={
                    <Link
                        href={appUrl('/admin/pendapatan')}
                        className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20"
                    >
                        Analisis Lanjut &rarr;
                    </Link>
                }
            >
                {trenPendapatan.length > 0 ? (
                    <TrenAreaChart data={trenPendapatan} height={260} />
                ) : (
                    <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">
                        Belum ada data pendapatan 7 hari terakhir.
                    </div>
                )}
            </ChartCard>


            {/* Visualizer Area Parkir & Slots */}
            <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                            <span>🗺️</span>
                            <span>Visualisasi Okupansi Area & Slot</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Peta slot real-time untuk memantau kapasitas fisik di lapangan.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                            <span className="text-slate-400">Tersedia</span>
                        </span>
                        <span className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                            <span className="text-slate-400">Terisi</span>
                        </span>
                        <span className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                            <span className="text-slate-400">Dipesan</span>
                        </span>
                        <span className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span>
                            <span className="text-slate-400">Perawatan</span>
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    {areas.map((area) => (
                        <div key={area.id_area} className="border-t border-slate-800/80 pt-4 first:border-0 first:pt-0">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-sm text-slate-200">
                                    {area.nama_area}
                                </span>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                    Terisi: {area.terisi} / {area.kapasitas} slot
                                </span>
                            </div>

                            <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                                {area.slots.map((slot) => {
                                    let badgeColor = 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300';
                                    if (slot.status === 'terisi') {
                                        badgeColor = 'bg-rose-950/60 border-rose-500/40 text-rose-300';
                                    } else if (slot.status === 'dipesan') {
                                        badgeColor = 'bg-amber-950/60 border-amber-500/40 text-amber-300';
                                    } else if (slot.status === 'perawatan' || slot.status === 'tidak_aktif') {
                                        badgeColor = 'bg-slate-800 border-slate-700 text-slate-500';
                                    }

                                    return (
                                        <div
                                            key={slot.id_slot}
                                            title={`Slot ${slot.kode_slot} (${slot.status})`}
                                            className={`p-1.5 rounded-lg border text-center font-mono text-[11px] font-bold transition hover:scale-105 cursor-default ${badgeColor}`}
                                        >
                                            {slot.kode_slot}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Audit Log Activity Stream */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                            <span>📜</span>
                            <span>Aktivitas Sistem & Audit Trail Terkini</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Catatan audit immutable snapshot atas seluruh aktivitas sensitif sistem.
                        </p>
                    </div>
                    <Link
                        href={appUrl('/admin/audit-logs')}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 transition"
                    >
                        Lihat Seluruh Log &rarr;
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-800/60 uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-3 py-2 rounded-l-lg">Waktu</th>
                                <th className="px-3 py-2">Aksi</th>
                                <th className="px-3 py-2">Tabel</th>
                                <th className="px-3 py-2">Pengguna</th>
                                <th className="px-3 py-2 rounded-r-lg">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {recentAudit.map((log) => (
                                <tr key={log.id_log} className="hover:bg-slate-800/30 transition">
                                    <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 border border-slate-700 text-amber-300">
                                            {log.aksi}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 font-mono text-slate-400">{log.tabel}</td>
                                    <td className="px-3 py-2.5 font-semibold text-slate-200">{log.user || 'Sistem'}</td>
                                    <td className="px-3 py-2.5 text-slate-300">{log.alasan}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

