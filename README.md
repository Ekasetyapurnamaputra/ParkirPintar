# 🚗 Parkir Pintar - Sistem Manajemen Parkir Modern & Terintegrasi

Sistem operasional dan pengawasan manajemen parkir berbasis **Laravel 12**, **Inertia.js**, dan **React 19**, dilengkapi dengan audit forensik, perhitungan tarif dinamis berbasis *snapshot*, alokasi slot per area, penutupan shift kasir, dan rekonsiliasi keuangan 3-arah.

---

## 📋 Prasyarat Sistem

Sebelum menjalankan aplikasi, pastikan perangkat Anda telah terinstal:
- **PHP** >= 8.2 (ekstensi `pdo_mysql`, `mbstring`, `openssl`, `curl` aktif)
- **Database**: MariaDB atau MySQL (aktif pada port default `3306`)
- **Web Server**: Apache (XAMPP) atau bawaan Laravel Artisan
- **Node.js** >= 18.x & **npm**
- **Composer**

---

## ⚙️ Konfigurasi Awal (Setup)

### 1. Salin Environment File (Jika Belum Ada)
Pastikan file `.env` di root project telah terkonfigurasi dengan database `parkir`:
```env
APP_NAME="Parkir Pintar"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost/aplikasi_parkir

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=parkir
DB_USERNAME=root
DB_PASSWORD=
```

### 2. Instalasi Dependensi Backend & Frontend
Jika baru pertama kali melakukan clone/setup:
```bash
# Instal dependensi PHP
composer install

# Instal dependensi JavaScript / React
npm install --legacy-peer-deps
```

### 3. Kompilasi Aset Frontend (React & Tailwind CSS)
Build aset produksi dengan Vite:
```bash
npm run build
```

---

## 🚀 Cara Menjalankan Website

Anda dapat menjalankan website dengan salah satu dari dua cara berikut:

### Opsi A: Menggunakan XAMPP (Apache) — Direkomendasikan
1. Buka **XAMPP Control Panel**.
2. Klik tombol **Start** pada modul **Apache** dan **MySQL**.
3. Pastikan folder project berada di `htdocs/aplikasi_parkir`.
4. Buka browser Anda dan akses:
   ```
   http://localhost/aplikasi_parkir
   ```
   *(Aplikasi akan otomatis mengarahkan ke halaman login)*.

---

### Opsi B: Menggunakan Laravel Artisan Serve (Development)
1. Pastikan modul **MySQL** di XAMPP telah aktif.
2. Buka terminal/PowerShell di direktori project:
   ```bash
   php artisan serve
   ```
   *(Jika PHP belum ada di PATH Windows, gunakan path XAMPP)*:
   ```powershell
   c:\xamppPUTRA\php\php.exe artisan serve
   ```
3. (Opsional) Jalankan Vite Dev Server di terminal terpisah jika ingin mengedit tampilan React secara *Hot Module Replacement (HMR)*:
   ```bash
   npm run dev
   ```
4. Buka browser dan akses:
   ```
   http://127.0.0.1:8000
   ```

---

## 🔑 Akun Bawaan (Demo Login)

Sistem telah dilengkapi tombol akses cepat (*Quick Fill*) pada halaman login untuk akun berikut:

| Peran (Role) | Username | Password | Deskripsi Kewenangan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin1` | `admin123` | Akses penuh dashboard analitik, tarif, slot, persetujuan shift, koreksi transaksi, rekonsiliasi, dan audit log. |
| **Petugas Gerbang** | `petugas1` | `petugas123` | Terminal check-in (cetak tiket), check-out kalkulasi tarif instan, monitoring sesi parkir aktif, dan penutupan shift kasir. |
| **Owner** | `owner1` | `owner123` | Hak akses pengawasan laporan eksekutif dan audit keuangan. |

---

## 🛠️ Fitur-Fitur Utama Sistem

### 1. Terminal Operasional Petugas (`/petugas/dashboard`)
- **Check-in Cepat**: Input plat nomor, jenis kendaraan (motor/mobil/lainnya), pemilihan area parkir, alokasi slot opsional, warna, dan nama pemilik.
- **Check-out & Kalkulasi Otomatis (AJAX)**: Scan kode tiket atau cari nomor plat untuk melihat rincian durasi jam dan tagihan parkir secara instan sebelum pembayaran diproses.
- **Dukungan Multimetode Pembayaran**: Tunai, QRIS, Transfer Bank, dan Kartu Debit/Kredit.
- **Pengajuan Koreksi Transaksi**: Mekanisme koreksi terverifikasi jika terjadi kesalahan input atau tiket bermasalah.
- **Formulir Penutupan Shift Kasir**: Petugas memasukkan jam mulai, jam selesai, penghitungan fisik uang tunai laci, dan total setoran kasir.

### 2. Panel Administrator (`/admin/*`)
- **Executive Dashboard**: KPI total kapasitas, terisi, slot tersedia, grafik trafik hari ini, total omset harian, serta visualisasi slot per area parkir.
- **Manajemen Slot Parkir**: Kontrol status operasional slot individual (`tersedia`, `perawatan`, `tidak aktif`).
- **Konfigurasi Tarif & Parameter Operasional**: Tarif dinamis per jam dengan *snapshot* aman (tidak mengubah nilai transaksi lama), toleransi durasi, dan denda tiket hilang.
- **Persetujuan Shift & Koreksi Transaksi**: Peninjauan laporan shift kasir dengan deteksi selisih otomatis (*cash discrepancy detection*).
- **Rekonsiliasi 3-Arah (`/admin/rekonsiliasi`)**: Pencocokan silang otomatis antara:
  1. Catatan sesi fisik gerbang (masuk & keluar).
  2. Penerimaan pembayaran resmi sistem.
  3. Laporan kas fisik dan setoran kasir shift.
- **Audit Log Terstruktur (`/admin/audit-logs`)**: Riwayat audit *immutable* lengkap dengan pembanding snapshot JSON (*data sebelum vs data sesudah perubahan*).

---

## 🧪 Perintah Pengujian & Maintenance

### Menjalankan Unit & Feature Tests
Untuk memastikan seluruh logika backend, integritas transaksi, dan otorisasi peran berjalan normal:
```bash
php artisan test
```

### Menghapus Cache Aplikasi
Jika Anda mengubah konfigurasi `.env` atau route:
```bash
php artisan optimize:clear
```

### Memeriksa Jadwal Reservasi Kedaluwarsa (No-Show)
Untuk membebaskan slot parkir yang melewati batas kedatangan:
```bash
php artisan parkir:check-noshow
```

---

## 📂 Struktur Direktori Utama

```
aplikasi_parkir/
├── app/
│   ├── Http/Controllers/    # AdminController, AuthController, PetugasController, DashboardController
│   ├── Http/Middleware/     # HandleInertiaRequests, RoleMiddleware
│   ├── Models/              # User, Transaksi, AreaParkir, SlotParkir, Tarif, Pembayaran, PenutupanShift, AuditLog, Pengaturan
│   └── Services/            # ParkirService, ShiftService, TarifService, AuditService
├── database/migrations/     # Skema database & tabel-tabel terstruktur
├── resources/
│   ├── css/app.css          # Tailwind CSS v4 styling
│   ├── js/
│   │   ├── app.jsx          # React & Inertia Client Entry Point
│   │   ├── Components/      # Layout.jsx (Navigasi & Alert)
│   │   ├── Pages/           # Halaman React (Auth, Admin, Petugas)
│   │   └── Utils/url.js     # Helper pathing dinamis (XAMPP subfolder friendly)
│   └── views/
│       └── app.blade.php    # Single Root HTML Inertia Shell
├── routes/
│   ├── web.php              # Definisi route web
│   └── console.php          # Scheduler & CLI commands
└── vite.config.js           # Konfigurasi bundling Vite + React + Tailwind
```

---

&copy; Parkir Pintar Enterprise. Logika audit transaksi presisi & manajemen tarif dinamis.

| Peran (Role) | Username | Password | Deskripsi Kewenangan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin1` | `admin123` | Akses penuh dashboard analitik, tarif, slot, persetujuan shift, koreksi transaksi, rekonsiliasi, dan audit log. |
| **Petugas Gerbang** | `petugas1` | `petugas123` | Terminal check-in (cetak tiket), check-out kalkulasi tarif instan, monitoring sesi parkir aktif, dan penutupan shift kasir. |
| **Owner** | `owner1` | `owner123` | Hak akses pengawasan laporan eksekutif dan audit keuangan. |

---

## 🛠️ Fitur-Fitur Utama Sistem

### 1. Terminal Operasional Petugas (`/petugas/dashboard`)
- **Check-in Cepat**: Input plat nomor, jenis kendaraan (motor/mobil/lainnya), pemilihan area parkir, alokasi slot opsional, warna, dan nama pemilik.
- **Check-out & Kalkulasi Otomatis (AJAX)**: Scan kode tiket atau cari nomor plat untuk melihat rincian durasi jam dan tagihan parkir secara instan sebelum pembayaran diproses.
- **Dukungan Multimetode Pembayaran**: Tunai, QRIS, Transfer Bank, dan Kartu Debit/Kredit.
- **Pengajuan Koreksi Transaksi**: Mekanisme koreksi terverifikasi jika terjadi kesalahan input atau tiket bermasalah.
- **Formulir Penutupan Shift Kasir**: Petugas memasukkan jam mulai, jam selesai, penghitungan fisik uang tunai laci, dan total setoran kasir.

### 2. Panel Administrator (`/admin/*`)
- **Executive Dashboard**: KPI total kapasitas, terisi, slot tersedia, grafik trafik hari ini, total omset harian, serta visualisasi slot per area parkir.
- **Manajemen Slot Parkir**: Kontrol status operasional slot individual (`tersedia`, `perawatan`, `tidak aktif`).
- **Konfigurasi Tarif & Parameter Operasional**: Tarif dinamis per jam dengan *snapshot* aman (tidak mengubah nilai transaksi lama), toleransi durasi, dan denda tiket hilang.
- **Persetujuan Shift & Koreksi Transaksi**: Peninjauan laporan shift kasir dengan deteksi selisih otomatis (*cash discrepancy detection*).
- **Rekonsiliasi 3-Arah (`/admin/rekonsiliasi`)**: Pencocokan silang otomatis antara:
  1. Catatan sesi fisik gerbang (masuk & keluar).
  2. Penerimaan pembayaran resmi sistem.
  3. Laporan kas fisik dan setoran kasir shift.
- **Audit Log Terstruktur (`/admin/audit-logs`)**: Riwayat audit *immutable* lengkap dengan pembanding snapshot JSON (*data sebelum vs data sesudah perubahan*).

---

## 🧪 Perintah Pengujian & Maintenance

### Menjalankan Unit & Feature Tests
Untuk memastikan seluruh logika backend, integritas transaksi, dan otorisasi peran berjalan normal:
```bash
php artisan test
```

### Menghapus Cache Aplikasi
Jika Anda mengubah konfigurasi `.env` atau route:
```bash
php artisan optimize:clear
```

### Memeriksa Jadwal Reservasi Kedaluwarsa (No-Show)
Untuk membebaskan slot parkir yang melewati batas kedatangan:
```bash
php artisan parkir:check-noshow
```

---

## 📂 Struktur Direktori Utama

```
aplikasi_parkir/
├── app/
│   ├── Http/Controllers/    # AdminController, AuthController, PetugasController, DashboardController
│   ├── Http/Middleware/     # HandleInertiaRequests, RoleMiddleware
│   ├── Models/              # User, Transaksi, AreaParkir, SlotParkir, Tarif, Pembayaran, PenutupanShift, AuditLog, Pengaturan
│   └── Services/            # ParkirService, ShiftService, TarifService, AuditService
├── database/migrations/     # Skema database & tabel-tabel terstruktur
├── resources/
│   ├── css/app.css          # Tailwind CSS v4 styling
│   ├── js/
│   │   ├── app.jsx          # React & Inertia Client Entry Point
│   │   ├── Components/      # Layout.jsx (Navigasi & Alert)
│   │   ├── Pages/           # Halaman React (Auth, Admin, Petugas)
│   │   └── Utils/url.js     # Helper pathing dinamis (XAMPP subfolder friendly)
│   └── views/
│       └── app.blade.php    # Single Root HTML Inertia Shell
├── routes/
│   ├── web.php              # Definisi route web
│   └── console.php          # Scheduler & CLI commands
└── vite.config.js           # Konfigurasi bundling Vite + React + Tailwind
```

---

&copy; Parkir Pintar Enterprise. Logika audit transaksi presisi & manajemen tarif dinamis.

# ParkirPintar
