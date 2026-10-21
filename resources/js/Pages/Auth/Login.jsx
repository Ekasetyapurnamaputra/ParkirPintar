import React from 'react';
import { useForm, Head, usePage } from '@inertiajs/react';
import {
    ArrowRightIcon,
    BoltIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    ClockIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Alert, BrandMark, Button, TextField } from '../../Components/UI';
import { appUrl } from '../../Utils/url';

const DEMO_ACCOUNTS = [
    {
        role: 'Admin',
        username: 'admin1',
        password: 'admin123',
        accent: 'text-amber-400',
        ring: 'hover:border-amber-500/50 hover:bg-amber-500/10',
        icon: ShieldCheckIcon,
    },
    {
        role: 'Petugas',
        username: 'petugas1',
        password: 'petugas123',
        accent: 'text-blue-400',
        ring: 'hover:border-blue-500/50 hover:bg-blue-500/10',
        icon: BuildingOffice2Icon,
    },
    {
        role: 'Owner',
        username: 'owner1',
        password: 'owner123',
        accent: 'text-emerald-400',
        ring: 'hover:border-emerald-500/50 hover:bg-emerald-500/10',
        icon: ChartBarIcon,
    },
];

const FEATURES = [
    { icon: ClockIcon, text: 'Monitoring real-time okupansi & durasi parkir' },
    { icon: BoltIcon, text: 'Check-in & check-out cepat dari satu terminal' },
    { icon: ShieldCheckIcon, text: 'Audit trail immutable untuk seluruh aktivitas' },
];

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const { flash } = usePage().props;

    const submit = (e) => {
        e.preventDefault();
        post(appUrl('/login'));
    };

    const fillDemo = (username, password) => {
        setData((prev) => ({ ...prev, username, password }));
    };

    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-900">
            <Head title="Masuk Sistem - Parkir Pintar" />

            {/* Latar dekoratif */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-500/5 blur-3xl" />
                <div className="login-grid absolute inset-0 opacity-40" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:grid lg:grid-cols-2">
                {/* ============ Panel Brand (desktop) ============ */}
                <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800/80 bg-slate-900/30 p-10 lg:flex xl:p-14">
                    <div className="flex items-center gap-3">
                        <BrandMark size="md" />
                        <div>
                            <p className="text-lg font-extrabold tracking-tight text-white">
                                PARKIR PINTAR
                            </p>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500/80">
                                Enterprise Edition
                            </p>
                        </div>
                    </div>

                    <div className="max-w-lg py-10">
                        <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white xl:text-5xl">
                            Kendalikan <span className="text-amber-400">Parkir</span> tanpa
                            drama.
                        </h1>
                        <p className="mt-5 text-base leading-relaxed text-slate-400">
                            Satu platform terpadu untuk operasional terminal, penagihan dinamis,
                            rekonsiliasi shift, dan jejak audit yang tidak dapat dimanipulasi.
                        </p>

                        <ul className="mt-8 space-y-4">
                            {FEATURES.map((feature) => (
                                <li key={feature.text} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                        <feature.icon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <span className="text-sm leading-relaxed text-slate-300">
                                        {feature.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-slate-800/80 pt-6 text-xs text-slate-500">
                        <span className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            Sistem aktif 24/7
                        </span>
                        <span>Audit trail immutable</span>
                        <span>&copy; {new Date().getFullYear()} Parkir Pintar</span>
                    </div>
                </aside>

                {/* ============ Panel Form ============ */}
                <main className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
                    <div className="mx-auto w-full max-w-md">
                        {/* Brand ringkas untuk mobile/tablet */}
                        <div className="mb-8 flex items-center gap-3 lg:hidden">
                            <BrandMark size="sm" />
                            <div>
                                <p className="font-extrabold tracking-tight text-white">
                                    PARKIR PINTAR
                                </p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/80">
                                    Enterprise Edition
                                </p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                                Masuk ke Sistem
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-400">
                                Gunakan akun Admin atau Petugas yang telah terdaftar untuk
                                melanjutkan.
                            </p>
                        </div>

                        {/* Notifikasi */}
                        <div className="mb-5 space-y-3">
                            {flash?.error && <Alert variant="error">{flash.error}</Alert>}
                            {flash?.warning && <Alert variant="warning">{flash.warning}</Alert>}
                            {flash?.info && <Alert variant="info">{flash.info}</Alert>}
                            {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
                            <form className="space-y-5" onSubmit={submit} noValidate>
                                <TextField
                                    label="Username"
                                    icon={UserIcon}
                                    type="text"
                                    name="username"
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck="false"
                                    required
                                    autoFocus
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="Masukkan username"
                                    error={errors.username}
                                />

                                <TextField
                                    label="Kata Sandi"
                                    icon={LockClosedIcon}
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan kata sandi"
                                    error={errors.password}
                                />

                                <div className="flex items-center justify-between gap-3 pt-0.5">
                                    <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-400 transition hover:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-600 bg-slate-800 text-amber-500 transition focus:ring-2 focus:ring-amber-500/50"
                                        />
                                        <span>Ingat saya</span>
                                    </label>
                                    <span className="hidden text-xs text-slate-500 sm:block">
                                        Lupa kata sandi? Hubungi admin.
                                    </span>
                                </div>

                                <Button
                                    type="submit"
                                    loading={processing}
                                    loadingText="Memproses..."
                                    className="mt-1"
                                >
                                    Masuk ke Sistem
                                    {!processing && (
                                        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </Button>
                            </form>

                            {/* Akses cepat akun demo */}
                            <div className="mt-7 border-t border-slate-800 pt-6">
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                        Akses Cepat
                                    </span>
                                    <span className="h-px flex-1 bg-slate-800" />
                                    <span className="text-[11px] text-slate-600">Akun demo</span>
                                </div>

                                <div className="grid grid-cols-1 gap-2 xs:grid-cols-3 sm:gap-2.5">
                                    {DEMO_ACCOUNTS.map((account) => (
                                        <button
                                            key={account.role}
                                            type="button"
                                            onClick={() => fillDemo(account.username, account.password)}
                                            className={`group flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-left transition
                                                hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                                                ${account.ring}`}
                                        >
                                            <account.icon
                                                className={`h-5 w-5 shrink-0 ${account.accent}`}
                                                aria-hidden="true"
                                            />
                                            <span className="min-w-0">
                                                <span
                                                    className={`block text-xs font-bold ${account.accent}`}
                                                >
                                                    {account.role}
                                                </span>
                                                <span className="block truncate font-mono text-[10px] text-slate-500">
                                                    {account.username}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
                            Akun pengguna dikelola langsung oleh administrator sistem.
                            <br className="hidden sm:block" /> Hubungi admin bila kehilangan akses.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}

