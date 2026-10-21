/**
 * Format angka rupiah tanpa desimal, konsisten dengan halaman lain.
 */
export function formatRp(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(num) || 0);
}

/**
 * Format angka ringkas untuk label sumbu grafik (mis. 1,2 jt / 350 rb).
 */
export function formatRpShort(num) {
    const value = Number(num) || 0;
    const abs = Math.abs(value);

    if (abs >= 1_000_000_000) {
        return `Rp ${(value / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)} M`;
    }
    if (abs >= 1_000_000) {
        return `Rp ${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)} jt`;
    }
    if (abs >= 1_000) {
        return `Rp ${Math.round(value / 1_000)} rb`;
    }

    return `Rp ${Math.round(value)}`;
}

/**
 * Format persen dengan tanda (+/-) untuk indikator perubahan.
 */
export function formatPersen(num) {
    const value = Number(num) || 0;
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}%`;
}
