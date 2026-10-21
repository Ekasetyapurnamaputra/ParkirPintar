import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { appUrl } from '../../Utils/url';

export default function Tarifs({ tarifs = [], settings = [] }) {
    const [editingTarif, setEditingTarif] = useState(null);
    const [editingSetting, setEditingSetting] = useState(null);

    const tarifForm = useForm({
        tarif_per_jam: '',
    });

    const settingForm = useForm({
        kunci: '',
        nilai: '',
    });

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(num) || 0);
    };

    const openEditTarif = (t) => {
        setEditingTarif(t);
        tarifForm.setData('tarif_per_jam', t.tarif_per_jam);
    };

    const submitTarif = (e) => {
        e.preventDefault();
        tarifForm.post(appUrl(`/admin/tarifs/${editingTarif.id_tarif}`), {
            onSuccess: () => {
                setEditingTarif(null);
                tarifForm.reset();
            },
        });
    };

    const openEditSetting = (s) => {
        setEditingSetting(s);
        settingForm.setData({
            kunci: s.kunci,
            nilai: s.nilai,
        });
    };

    const submitSetting = (e) => {
        e.preventDefault();
        settingForm.post(appUrl('/admin/pengaturan'), {
            onSuccess: () => {
                setEditingSetting(null);
                settingForm.reset();
            },
        });
    };

    return (
        <Layout title="Tarif & Konfigurasi Sistem">
            <Head title="Tarif & Pengaturan - Parkir Pintar" />

            <div className="mb-6">
                <h1 className="text-2xl font-black text-white">Tarif Parkir & Parameter Operasional</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Atur tarif per jam kendaraan (menggunakan snapshot tarif aman) serta parameter sistem operasional.
                </p>
            </div>

            {/* Tarif Cards */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                    <span>🏷️</span>
                    <span>Tarif Parkir Per Jam</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tarifs.map((t) => (
                        <div key={t.id_tarif} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                                        Jenis Kendaraan
                                    </span>
                                    <h3 className="text-xl font-black text-white capitalize mt-0.5">
                                        {t.jenis_kendaraan}
                                    </h3>
                                </div>
                                <span className="text-2xl">
                                    {t.jenis_kendaraan === 'motor' ? '🛵' : t.jenis_kendaraan === 'mobil' ? '🚗' : '🚚'}
                                </span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800 flex items-baseline justify-between">
                                <div>
                                    <span className="text-2xl font-black text-emerald-400">
                                        {formatRp(t.tarif_per_jam)}
                                    </span>
                                    <span className="text-xs text-slate-500 block">/ jam parkir</span>
                                </div>
                                <button
                                    onClick={() => openEditTarif(t)}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700 transition"
                                >
                                    Ubah Tarif
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
                    💡 <strong className="text-slate-300">Integritas Keuangan:</strong> Perubahan tarif hanya berlaku untuk sesi kendaraan yang baru masuk setelah perubahan. Sesi yang sedang berlangsung atau yang sudah keluar tetap dihitung berdasarkan snapshot tarif saat transaksi dibuat.
                </div>
            </div>

            {/* Settings Table */}
            <div>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                    <span>⚙️</span>
                    <span>Parameter Operasional Sistem</span>
                </h2>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-5 py-3.5">Kunci Parameter</th>
                                <th className="px-5 py-3.5">Nilai Terpasang</th>
                                <th className="px-5 py-3.5">Keterangan Fungsi</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {settings.map((s) => (
                                <tr key={s.id_setting} className="hover:bg-slate-800/40 transition">
                                    <td className="px-5 py-3.5 font-mono text-amber-300 font-bold text-xs">{s.kunci}</td>
                                    <td className="px-5 py-3.5 font-bold text-white">{s.nilai}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-400">{s.keterangan || '-'}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <button
                                            onClick={() => openEditSetting(s)}
                                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                                        >
                                            Edit Nilai
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Edit Tarif */}
            {editingTarif && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">
                                Ubah Tarif: <span className="capitalize text-amber-400">{editingTarif.jenis_kendaraan}</span>
                            </h3>
                            <button
                                onClick={() => setEditingTarif(null)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitTarif} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Tarif Per Jam (Rupiah)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={tarifForm.data.tarif_per_jam}
                                    onChange={(e) => tarifForm.setData('tarif_per_jam', e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {tarifForm.errors.tarif_per_jam && (
                                    <p className="text-xs text-rose-400 mt-1">{tarifForm.errors.tarif_per_jam}</p>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingTarif(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={tarifForm.processing}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                                >
                                    {tarifForm.processing ? 'Menyimpan...' : 'Simpan Tarif'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit Pengaturan */}
            {editingSetting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">
                                Edit Pengaturan: <span className="text-amber-400 font-mono text-xs">{editingSetting.kunci}</span>
                            </h3>
                            <button
                                onClick={() => setEditingSetting(null)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitSetting} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Nilai Parameter
                                </label>
                                <input
                                    type="text"
                                    value={settingForm.data.nilai}
                                    onChange={(e) => settingForm.setData('nilai', e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {settingForm.errors.nilai && (
                                    <p className="text-xs text-rose-400 mt-1">{settingForm.errors.nilai}</p>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingSetting(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={settingForm.processing}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                                >
                                    {settingForm.processing ? 'Menyimpan...' : 'Simpan Parameter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

