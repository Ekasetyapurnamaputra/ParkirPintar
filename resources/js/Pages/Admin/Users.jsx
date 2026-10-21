import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { appUrl } from '../../Utils/url';

export default function Users({ users, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        nama_lengkap: '',
        username: '',
        password: '',
        role: 'petugas',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(appUrl('/admin/users'), { search: searchTerm, role: roleFilter }, { preserveState: true });
    };

    const handleFilterRole = (role) => {
        setRoleFilter(role);
        router.get(appUrl('/admin/users'), { search: searchTerm, role }, { preserveState: true });
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(appUrl('/admin/users'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const toggleStatus = (id, username, currentStatus) => {
        const action = currentStatus ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} akun pengguna "${username}"?`)) {
            router.post(appUrl(`/admin/users/${id}/toggle`));
        }
    };

    return (
        <Layout title="Manajemen Pengguna">
            <Head title="Manajemen Pengguna - Parkir Pintar" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Manajemen Pengguna</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Kelola akun hak akses sistem untuk Admin, Petugas Operasional, dan Owner.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center space-x-2"
                >
                    <span>+ Tambah Akun Baru</span>
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="mb-6 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="w-full sm:w-auto flex items-center space-x-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama atau username..."
                        className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-72"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 transition"
                    >
                        Cari
                    </button>
                </form>

                <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Filter Peran:</span>
                    {['', 'admin', 'petugas', 'owner'].map((r) => (
                        <button
                            key={r}
                            onClick={() => handleFilterRole(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                                roleFilter === r
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {r || 'Semua'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-5 py-3.5">ID</th>
                                <th className="px-5 py-3.5">Nama Lengkap</th>
                                <th className="px-5 py-3.5">Username</th>
                                <th className="px-5 py-3.5">Peran</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.data.map((u) => (
                                <tr key={u.id_user} className="hover:bg-slate-800/40 transition">
                                    <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">#{u.id_user}</td>
                                    <td className="px-5 py-3.5 font-semibold text-white">{u.nama_lengkap}</td>
                                    <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">{u.username}</td>
                                    <td className="px-5 py-3.5">
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                u.role === 'admin'
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                                    : u.role === 'petugas'
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                                    : u.role === 'owner'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-slate-700 text-slate-300'
                                            }`}
                                        >
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span
                                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                u.status_aktif
                                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.status_aktif ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                            <span>{u.status_aktif ? 'Aktif' : 'Nonaktif'}</span>
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <button
                                            onClick={() => toggleStatus(u.id_user, u.username, u.status_aktif)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                                                u.status_aktif
                                                    ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'
                                                    : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                                            }`}
                                        >
                                            {u.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.links && users.links.length > 3 && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Menampilkan {users.from} - {users.to} dari {users.total} data
                        </div>
                        <div className="flex space-x-1">
                            {users.links.map((link, idx) => (
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

            {/* Modal Tambah User */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Tambah Pengguna Baru</h3>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_lengkap}
                                    onChange={(e) => setData('nama_lengkap', e.target.value)}
                                    required
                                    placeholder="cth: Ahmad Pratama"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.nama_lengkap && <p className="text-xs text-rose-400 mt-1">{errors.nama_lengkap}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    required
                                    placeholder="cth: petugas2"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.username && <p className="text-xs text-rose-400 mt-1">{errors.username}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Kata Sandi
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    placeholder="Minimal 6 karakter"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Peran Sistem
                                </label>
                                <select
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="petugas">Petugas (Operasional Gerbang)</option>
                                    <option value="admin">Administrator (Akses Penuh)</option>
                                    <option value="owner">Owner (Hak Akses Laporan)</option>
                                </select>
                                {errors.role && <p className="text-xs text-rose-400 mt-1">{errors.role}</p>}
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

