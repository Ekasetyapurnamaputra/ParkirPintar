import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import {
    ChartCard,
    MetodePieChart,
    PendapatanPerAreaChart,
    PendapatanPerJamChart,
    TrenHarianChart,
} from '../../Components/Charts';
import { appUrl } from '../../Utils/url';
import { formatPersen, formatRp } from '../../Utils/format';

/**
 * Preset periode cepat pada form filter.
 */
const PRESET_PERIODE = [
    { label: '7 Hari', hari: 6 },
    { label: '30 Hari', hari: 29 },
    { label: '90 Hari', hari: 89 },
    { label: '1 Tahun', hari: 364 },
];

/**
 * Kartu KPI ringkas pada bagian atas laporan.
 */
function KpiCard({ label, value, hint, badge, tone = 'default' }) {
    const toneClass = {
        default: 'border-slate-800 bg-slate-900',
        up: 'border-emerald-500/30 bg-emerald-500/5',
        down: 'border-rose-500/30 bg-rose-500/5',
    }[tone];

    return (
        <div className={`rounded-2xl border p-5 shadow-md ${toneClass}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
            {badge && <div className="mt-2">{badge}</div>}
        </div>
    );
}

export default function Pendapatan({
    laporan,
    filter = {},
    areaOptions = [],
    metodeOptions = [],
}) {
    const [dari, setDari] = useState(filter.dari || '');
    const [sampai, setSampai] = useState(filter.sampai || '');
    const [area, setArea] = useState(filter.area || '');
    const [metode, setMetode] = useState(filter.metode || '');

    const ringkasan = laporan?.ringkasan ?? {};
    const periode = laporan?.periode ?? {};
    const tren = laporan?.tren ?? [];
    const perJam = laporan?.per_jam ?? [];
    const perMetode = laporan?.per_metode ?? [];
    const perArea = laporan?.per_area ?? [];
    const perJenis = laporan?.per_jenis ?? [];
    const rekapHarian = laporan?.rekap_harian ?? [];

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        router.get(
            appUrl('/admin/pendapatan'),
            { dari, sampai, area, metode },
            { preserveState: true, preserveScroll: true }
        );
    };

    const terapkanPreset = (hari) => {
        const akhir = new Date();
        const awal = new Date();
        awal.setDate(akhir.getDate() - hari);

        // Format tanggal lokal (bukan UTC) agar tidak meleset sehari
        // ketika server berada di zona waktu WIB (UTC+7).
        const format = (d) => {
            const bulan = String(d.getMonth() + 1).padStart(2, '0');
            const hari = String(d.getDate()).padStart(2, '0');
            return `${d.getFullYear()}-${bulan}-${hari}`;
        };

        const params = { dari: format(awal), sampai: format(akhir), area, metode };

        setDari(params.dari);
        setSampai(params.sampai);

        router.get(appUrl('/admin/pendapatan'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilter = () => {
        setDari('');
        setSampai('');
        setArea('');
        setMetode('');
        router.get(appUrl('/admin/pendapatan'), {}, { preserveState: true, preserveScroll: true });
    };

    const perubahanPositif = Number(ringkasan.persen_perubahan) >= 0;
    const adaData = Number(ringkasan.total) > 0;

    return (
        <Layout title="Grafik Pendapatan">
            <Head title="Grafik Pendapatan - Parkir Pintar" />


            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        Grafik Pendapatan
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Analisis arus kas dari pembayaran lunas beserta tren harian dan komposisinya.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {PRESET_PERIODE.map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => terapkanPreset(preset.hari)}
                            className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-500/40 hover:text-amber-400"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter */}
            <form
                onSubmit={handleFilterSubmit}
                className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-5"
            >
                <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                        Dari Tanggal
                    </label>
                    <input
                        type="date"
                        value={dari}
                        onChange={(e) => setDari(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                        Sampai Tanggal
                    </label>
                    <input
                        type="date"
                        value={sampai}
                        onChange={(e) => setSampai(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                        Area Parkir
                    </label>
                    <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">Semua Area</option>
                        {areaOptions.map((opt) => (
                            <option key={opt.id_area} value={opt.id_area}>
                                {opt.nama_area}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                        Metode Bayar
                    </label>
                    <select
                        value={metode}
                        onChange={(e) => setMetode(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">Semua Metode</option>
                        {metodeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end gap-2">
                    <button
                        type="submit"
                        className="flex-1 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
                    >
                        Terapkan
                    </button>
                    <button
                        type="button"
                        onClick={resetFilter}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-rose-500/40 hover:text-rose-300"
                    >
                        Reset
                    </button>
                </div>
            </form>


            {/* KPI Ringkasan */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Total Pendapatan"
                    value={formatRp(ringkasan.total)}
                    hint={`Periode ${periode.mulai ?? '-'} s/d ${periode.selesai ?? '-'}`}
                />
                <KpiCard
                    label="Jumlah Transaksi"
                    value={Number(ringkasan.transaksi ?? 0).toLocaleString('id-ID')}
                    hint={`Rata-rata ${formatRp(ringkasan.rata_rata_transaksi)} / transaksi`}
                />
                <KpiCard
                    label="Rata-rata per Hari"
                    value={formatRp(ringkasan.rata_rata_harian)}
                    hint={`Perkiraan ${Number(periode.jumlah_hari ?? 0)} hari`}
                />
                <KpiCard
                    label="vs Periode Sebelumnya"
                    value={formatPersen(ringkasan.persen_perubahan)}
                    tone={perubahanPositif ? 'up' : 'down'}
                    badge={
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                perubahanPositif
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-rose-500/15 text-rose-400'
                            }`}
                        >
                            {perubahanPositif ? '▲' : '▼'} {formatPersen(ringkasan.persen_perubahan)}
                        </span>
                    }
                    hint={`Sebelumnya ${formatRp(ringkasan.total_sebelumnya)} · ${Number(
                        ringkasan.transaksi_sebelumnya ?? 0
                    ).toLocaleString('id-ID')} transaksi`}
                />
            </div>

            {!adaData && (
                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-300">
                        Tidak ada pembayaran lunas pada periode ini.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Ubah rentang tanggal atau longgarkan filter area/metode pembayaran.
                    </p>
                </div>
            )}

            {/* Tren harian + kumulatif */}
            <ChartCard
                title="Tren Pendapatan Harian"
                subtitle="Batang: pendapatan per hari · Garis: akumulasi pendapatan"
                icon="📈"
                className="mb-6"
            >
                <TrenHarianChart data={tren} height={340} />
            </ChartCard>

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ChartCard
                    title="Pendapatan per Jam"
                    subtitle="Distribusi jam sibuk transaksi keluar"
                    icon="🕒"
                >
                    <PendapatanPerJamChart data={perJam} height={280} />
                </ChartCard>

                <ChartCard
                    title="Komposisi Metode Pembayaran"
                    subtitle="Porsi pendapatan per metode pembayaran"
                    icon="💳"
                >
                    <MetodePieChart data={perMetode} height={280} />
                </ChartCard>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ChartCard
                    title="Pendapatan per Area Parkir"
                    subtitle="Kontribusi pendapatan tiap area"
                    icon="🏢"
                >
                    <PendapatanPerAreaChart data={perArea} height={260} />
                </ChartCard>

                <ChartCard
                    title="Pendapatan per Jenis Kendaraan"
                    subtitle="Rekapulasi pendapatan berdasarkan jenis kendaraan"
                    icon="🚗"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                                    <th className="pb-2 font-semibold">Jenis</th>
                                    <th className="pb-2 text-right font-semibold">Transaksi</th>
                                    <th className="pb-2 text-right font-semibold">Pendapatan</th>
                                    <th className="pb-2 text-right font-semibold">Porsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/70">
                                {perJenis.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-6 text-center text-xs text-slate-500">
                                            Belum ada data jenis kendaraan.
                                        </td>
                                    </tr>
                                )}
                                {perJenis.map((item) => {
                                    const total = Number(ringkasan.total) || 0;
                                    const porsi = total > 0 ? (Number(item.total) / total) * 100 : 0;

                                    return (
                                        <tr key={item.jenis} className="text-slate-300">
                                            <td className="py-2.5 font-semibold text-white">
                                                {item.label}
                                            </td>
                                            <td className="py-2.5 text-right">
                                                {Number(item.transaksi ?? 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-2.5 text-right font-bold text-amber-400">
                                                {formatRp(item.total)}
                                            </td>
                                            <td className="py-2.5 text-right text-xs text-slate-400">
                                                {porsi.toFixed(1)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>



            {/* Rekap harian */}
            <ChartCard
                title="Rekap Harian"
                subtitle="Rincian pendapatan per tanggal (terbaru di atas)"
                icon="📋"
            >
                <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-900">
                            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                                <th className="pb-2 font-semibold">Tanggal</th>
                                <th className="pb-2 text-right font-semibold">Transaksi</th>
                                <th className="pb-2 text-right font-semibold">Pendapatan</th>
                                <th className="pb-2 text-right font-semibold">Rata-rata/Transaksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                            {rekapHarian.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-xs text-slate-500">
                                        Belum ada data pada periode ini.
                                    </td>
                                </tr>
                            )}
                            {rekapHarian.map((row) => (
                                <tr key={row.tanggal} className="text-slate-300 hover:bg-slate-800/40">
                                    <td className="py-2.5 font-semibold text-white">{row.tanggal}</td>
                                    <td className="py-2.5 text-right">
                                        {Number(row.transaksi ?? 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-2.5 text-right font-bold text-amber-400">
                                        {formatRp(row.total)}
                                    </td>
                                    <td className="py-2.5 text-right text-xs text-slate-400">
                                        {Number(row.transaksi) > 0
                                            ? formatRp(row.total / row.transaksi)
                                            : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ChartCard>
        </Layout>
    );
}
