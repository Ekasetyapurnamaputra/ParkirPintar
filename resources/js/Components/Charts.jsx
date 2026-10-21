import React from 'react';
import {
    Area,
    AreaChart,
    Bar,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    ComposedChart,
} from 'recharts';
import { formatRp, formatRpShort } from '../Utils/format';

/**
 * Palet warna yang konsisten dengan tema aplikasi (slate + amber/emerald).
 */
export const CHART_COLORS = [
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#a855f7', // purple-500
    '#f43f5e', // rose-500
    '#14b8a6', // teal-500
    '#eab308', // yellow-500
    '#8b5cf6', // violet-500
];

const AXIS_COLOR = '#64748b';
const GRID_COLOR = '#1e293b';

/**
 * Tooltip kustom bergaya dark agar konsisten dengan kartu gelap.
 */
export function ChartTooltip({ active, payload, label, formatter, labelFormatter }) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur">
            {label !== undefined && label !== null && (
                <div className="mb-1 text-xs font-bold text-slate-200">
                    {labelFormatter ? labelFormatter(label) : label}
                </div>
            )}
            <div className="space-y-0.5">
                {payload.map((entry, index) => (
                    <div key={`${entry.dataKey}-${index}`} className="flex items-center gap-2 text-xs">
                        <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: entry.color || entry.payload?.fill }}
                        />
                        <span className="text-slate-400">{entry.name}</span>
                        <span className="ml-auto font-bold text-white">
                            {formatter ? formatter(entry.value, entry) : formatRp(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Kartu pembungkus grafik dengan judul & deskripsi opsional.
 */
export function ChartCard({ title, subtitle, icon, action, children, className = '' }) {
    return (
        <div className={`rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-md ${className}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                        {icon && <span aria-hidden="true">{icon}</span>}
                        <span>{title}</span>
                    </h2>
                    {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}


/**
 * Grafik tren pendapatan harian: batang = pendapatan harian, garis = kumulatif.
 */
export function TrenHarianChart({ data = [], height = 320 }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="gradPendapatan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.15} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    axisLine={{ stroke: GRID_COLOR }}
                    tickLine={false}
                    minTickGap={12}
                />
                <YAxis
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={78}
                    tickFormatter={formatRpShort}
                />
                <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                />
                <Legend
                    verticalAlign="top"
                    height={32}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }}
                />
                <Bar
                    dataKey="total"
                    name="Pendapatan Harian"
                    fill="url(#gradPendapatan)"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={46}
                />
                <Line
                    type="monotone"
                    dataKey="kumulatif"
                    name="Kumulatif"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

/**
 * Grafik area tren pendapatan (dipakai pada dashboard ringkas).
 */
export function TrenAreaChart({ data = [], height = 260, color = '#f59e0b' }) {
    const gradientId = `gradArea-${color.replace('#', '')}`;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    axisLine={{ stroke: GRID_COLOR }}
                    tickLine={false}
                    minTickGap={16}
                />
                <YAxis
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={78}
                    tickFormatter={formatRpShort}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
                <Area
                    type="monotone"
                    dataKey="total"
                    name="Pendapatan"
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#${gradientId})`}
                    activeDot={{ r: 4 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

/**
 * Grafik batang pendapatan per jam (distribusi jam sibuk).
 */
export function PendapatanPerJamChart({ data = [], height = 280 }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="gradPerJam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fill: AXIS_COLOR, fontSize: 10 }}
                    axisLine={{ stroke: GRID_COLOR }}
                    tickLine={false}
                    interval={1}
                />
                <YAxis
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                    tickFormatter={formatRpShort}
                />
                <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                />
                <Bar
                    dataKey="total"
                    name="Pendapatan"
                    fill="url(#gradPerJam)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

/**
 * Donut komposisi pendapatan per metode pembayaran.
 */
export function MetodePieChart({ data = [], height = 280 }) {
    const total = data.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

    if (data.length === 0 || total <= 0) {
        return (
            <div
                className="flex items-center justify-center text-sm text-slate-500"
                style={{ height }}
            >
                Belum ada data metode pembayaran pada periode ini.
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer width="100%" height={height} className="flex-1">
                <PieChart>
                    <Tooltip content={<ChartTooltip />} />
                    <Pie
                        data={data}
                        dataKey="total"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="82%"
                        paddingAngle={3}
                        stroke="#0f172a"
                        strokeWidth={2}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={entry.metode ?? index}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            <ul className="w-full shrink-0 space-y-2 sm:w-52">
                {data.map((item, index) => (
                    <li key={item.metode ?? index} className="flex items-center gap-2 text-xs">
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="truncate text-slate-400">{item.label}</span>
                        <span className="ml-auto font-bold text-white">
                            {total > 0 ? ((item.total / total) * 100).toFixed(1) : 0}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Grafik batang horizontal pendapatan per area parkir.
 */
export function PendapatanPerAreaChart({ data = [], height = 260 }) {
    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-sm text-slate-500"
                style={{ height }}
            >
                Belum ada data area parkir pada periode ini.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis
                    type="number"
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatRpShort}
                />
                <YAxis
                    type="category"
                    dataKey="nama_area"
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                />
                <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                />
                <Bar
                    dataKey="total"
                    name="Pendapatan"
                    fill="#3b82f6"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={34}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
