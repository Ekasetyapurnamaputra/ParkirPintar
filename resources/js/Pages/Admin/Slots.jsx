import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { appUrl } from '../../Utils/url';

export default function Slots({ areas = [] }) {
    const [selectedSlot, setSelectedSlot] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        status: 'tersedia',
    });

    const openEditModal = (slot) => {
        if (slot.status === 'terisi' || slot.status === 'dipesan') {
            alert(`Slot ${slot.kode_slot} sedang ${slot.status}. Anda tidak dapat mengubah status slot yang sedang digunakan secara manual.`);
            return;
        }
        setSelectedSlot(slot);
        setData('status', slot.status);
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        if (!selectedSlot) return;

        post(appUrl(`/admin/slots/${selectedSlot.id_slot}`), {
            onSuccess: () => {
                setSelectedSlot(null);
                reset();
            },
        });
    };

    return (
        <Layout title="Manajemen Slot Parkir">
            <Head title="Manajemen Slot Parkir - Parkir Pintar" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Manajemen Area & Slot Parkir</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Kontrol status fisik slot parkir individual (tersedia, perawatan, tidak aktif).
                    </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
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
                        <span className="text-slate-400">Perawatan / Nonaktif</span>
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {areas.map((area) => (
                    <div key={area.id_area} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <div>
                                <h2 className="text-lg font-bold text-white">{area.nama_area}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Total Kapasitas: {area.kapasitas} | Terisi Saat Ini: {area.terisi}
                                </p>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                                {Math.round((area.terisi / area.kapasitas) * 100) || 0}% Okupansi
                            </span>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2.5">
                            {area.slots.map((slot) => {
                                let badgeClass = 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:border-emerald-400';
                                if (slot.status === 'terisi') {
                                    badgeClass = 'bg-rose-950/60 border-rose-500/40 text-rose-300 opacity-90 cursor-not-allowed';
                                } else if (slot.status === 'dipesan') {
                                    badgeClass = 'bg-amber-950/60 border-amber-500/40 text-amber-300 opacity-90 cursor-not-allowed';
                                } else if (slot.status === 'perawatan' || slot.status === 'tidak_aktif') {
                                    badgeClass = 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500';
                                }

                                return (
                                    <button
                                        key={slot.id_slot}
                                        type="button"
                                        onClick={() => openEditModal(slot)}
                                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${badgeClass}`}
                                    >
                                        <span className="font-mono font-bold text-sm">{slot.kode_slot}</span>
                                        <span className="text-[10px] uppercase font-medium mt-1 truncate max-w-full">
                                            {slot.status}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Update Status Slot */}
            {selectedSlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">
                                Atur Status Slot: <span className="text-amber-400 font-mono">{selectedSlot.kode_slot}</span>
                            </h3>
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Status Operasional Slot
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="tersedia">Tersedia (Dapat Dipakai Parkir)</option>
                                    <option value="perawatan">Perawatan (Maintenance Fisik)</option>
                                    <option value="tidak_aktif">Tidak Aktif (Ditutup Sementara)</option>
                                </select>
                                {errors.status && <p className="text-xs text-rose-400 mt-1">{errors.status}</p>}
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSlot(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Perbarui Status'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

