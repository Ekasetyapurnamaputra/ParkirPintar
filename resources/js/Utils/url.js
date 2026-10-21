/**
 * Helper to generate correct URLs whether the app runs under root domain (e.g. localhost:8000)
 * or under an Apache subfolder in XAMPP (e.g. localhost/aplikasi_parkir or localhost/aplikasi_parkir/public).
 */
export function appUrl(path = '') {
    const pathname = window.location.pathname;
    let base = '';

    if (pathname.includes('/aplikasi_parkir/public')) {
        base = '/aplikasi_parkir/public';
    } else if (pathname.includes('/aplikasi_parkir')) {
        base = '/aplikasi_parkir';
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
}

