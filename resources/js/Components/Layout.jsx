import React, { useEffect, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { appUrl } from '../Utils/url';
import { BrandMark } from './UI';

export default function Layout({ title, children }) {
    const { auth, flash, errors } = usePage().props;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Tutup menu mobile saat lebar layar berubah ke desktop
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const handle = (e) => e.matches && setMobileMenuOpen(false);
        mq.addEventListener('change', handle);
        return () => mq.removeEventListener('change', handle);
    }, []);

    // Cegah scroll body saat menu mobile terbuka
    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(appUrl('/logout'));
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'owner';
    const isPetugas = user?.role === 'petugas';

    const adminNavLinks = [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Transaksi', path: '/admin/transaksi' },
        { label: 'Slot Parkir', path: '/admin/slots' },
        { label: 'Tarif & Sistem', path: '/admin/tarifs' },
        { label: 'Penutupan Shift', path: '/admin/shifts' },
        { label: 'Rekonsiliasi', path: '/admin/rekonsiliasi' },
        { label: 'Pendapatan', path: '/admin/pendapatan' },
        { label: 'Pengguna', path: '/admin/users' },
        { label: 'Audit Log', path: '/admin/audit-logs' },
    ];

    const petugasNavLinks = [
        { label: 'Terminal Parkir', path: '/petugas/dashboard' },
        { label: 'Riwayat Shift', path: '/petugas/shift-riwayat' },
    ];

    const currentLinks = (isAdmin ? adminNavLinks : isPetugas ? petugasNavLinks : []).map(link => ({
        ...link,
        href: appUrl(link.path),
    }));

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 shadow-md backdrop-blur-lg">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-3">
                        {/* Brand Logo */}
                        <Link href={appUrl('/dashboard')} className="flex shrink-0 items-center gap-3">
                            <BrandMark size="sm" />
                            <div className="hidden sm:block">
                                <span className="bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
                                    PARKIR PINTAR
                                </span>
                                <span className="ml-2 hidden rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400 lg:inline-block">
                                    Enterprise
                                </span>
                            </div>
                        </Link>

                        {/* Navigasi desktop (dapat digulir horizontal pada tablet) */}
                        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex md:px-2">
                            {currentLinks.map((link) => {
                                const isActive =
                                    window.location.pathname.endsWith(link.path) ||
                                    window.location.pathname === link.href;
                                return (
                                    <Link
                                        key={link.path}
                                        href={link.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                                                : 'border border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Profile & Logout */}
                        <div className="hidden shrink-0 items-center gap-3 md:flex">
                            <div className="hidden text-right lg:block">
                                <div className="max-w-[12rem] truncate text-sm font-semibold text-slate-200">
                                    {user?.nama_lengkap}
                                </div>
                                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                    {user?.role}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="cursor-pointer rounded-lg border border-rose-800/50 bg-rose-950/60 px-3.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/80 hover:text-rose-100"
                            >
                                Keluar
                            </button>
                        </div>

                        {/* Tombol menu mobile */}
                        <div className="flex shrink-0 md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                aria-expanded={mobileMenuOpen}
                                aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                                aria-controls="mobile-navigation-menu"
                            >
                                {mobileMenuOpen ? (
                                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && (
                    <div
                        id="mobile-navigation-menu"
                        className="max-h-[calc(100vh-4rem)] space-y-1 overflow-y-auto overscroll-contain border-t border-slate-800 bg-slate-900 px-4 pb-4 pt-2 md:hidden"
                    >
                        {currentLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded-md px-3 py-2.5 text-base font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
                            <div className="min-w-0">
                                <div className="truncate font-medium text-white">
                                    {user?.nama_lengkap}
                                </div>
                                <div className="text-xs font-semibold uppercase text-amber-400">
                                    {user?.role}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="shrink-0 rounded-lg bg-rose-950 px-3 py-1.5 text-xs font-bold text-rose-300"
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Flash Messages */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4">
                {flash?.success && (
                    <div className="mb-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 flex items-center justify-between shadow-lg">
                        <div className="flex items-center space-x-3">
                            <span className="text-xl">✅</span>
                            <span className="text-sm font-medium">{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 p-4 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-200 flex items-center justify-between shadow-lg">
                        <div className="flex items-center space-x-3">
                            <span className="text-xl">⚠️</span>
                            <span className="text-sm font-medium">{flash.error}</span>
                        </div>
                    </div>
                )}
                {flash?.warning && (
                    <div className="mb-4 p-4 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-200 flex items-center justify-between shadow-lg">
                        <div className="flex items-center space-x-3">
                            <span className="text-xl">🔔</span>
                            <span className="text-sm font-medium">{flash.warning}</span>
                        </div>
                    </div>
                )}
                {errors && Object.keys(errors).length > 0 && (
                    <div className="mb-4 p-4 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-200 shadow-lg">
                        <div className="text-sm font-bold mb-1">Perhatian:</div>
                        <ul className="list-disc list-inside text-xs space-y-0.5">
                            {Object.values(errors).map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900/60 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Parkir Pintar Enterprise. Logika audit transaksi presisi & manajemen tarif dinamis.
            </footer>
        </div>
    );
}
