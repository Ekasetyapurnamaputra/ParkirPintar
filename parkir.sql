-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 21, 2026 at 09:11 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `parkir`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_parkir_keluar` (IN `p_id_parkir` INT, IN `p_id_user` INT)   BEGIN
  DECLARE v_masuk  DATETIME;
  DECLARE v_tarif  DECIMAL(10,0);
  DECLARE v_area   INT;
  DECLARE v_status VARCHAR(10);
  DECLARE v_durasi INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SELECT 'GAGAL: transaksi dibatalkan' AS pesan;
  END;

  START TRANSACTION;

  SELECT t.waktu_masuk, tr.tarif_per_jam, t.id_area, t.status
    INTO v_masuk, v_tarif, v_area, v_status
  FROM tb_transaksi t
  JOIN tb_tarif tr ON tr.id_tarif = t.id_tarif
  WHERE t.id_parkir = p_id_parkir
  FOR UPDATE;

  IF v_status IS NULL OR v_status <> 'masuk' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaksi tidak ditemukan atau sudah keluar';
  END IF;

  SET v_durasi = GREATEST(1, CEIL(TIMESTAMPDIFF(MINUTE, v_masuk, NOW()) / 60));

  UPDATE tb_transaksi
     SET waktu_keluar = NOW(), durasi_jam = v_durasi,
         biaya_total = v_durasi * v_tarif, status = 'keluar'
   WHERE id_parkir = p_id_parkir;

  UPDATE tb_area_parkir SET terisi = terisi - 1 WHERE id_area = v_area;

  INSERT INTO tb_log_aktivitas (id_user, aktivitas)
  VALUES (p_id_user, CONCAT('Kendaraan keluar, id_parkir=', p_id_parkir));

  COMMIT;
  SELECT 'BERHASIL' AS pesan, v_durasi AS durasi_jam, v_durasi * v_tarif AS biaya;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_10_21_000001_enhance_tb_user_and_tb_area_parkir', 1),
(5, '2026_10_21_000002_create_tb_slot_parkir_table', 1),
(6, '2026_10_21_000003_enhance_tb_transaksi_table', 1),
(7, '2026_10_21_000004_create_tb_reservasi_table', 1),
(8, '2026_10_21_000005_create_tb_pembayaran_table', 1),
(9, '2026_10_21_000006_create_tb_penutupan_shift_table', 1),
(10, '2026_10_21_000007_create_tb_audit_log_and_tb_pengaturan_table', 1),
(11, '2026_10_21_000008_reconcile_existing_data', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tb_area_parkir`
--

CREATE TABLE `tb_area_parkir` (
  `id_area` int(11) NOT NULL,
  `nama_area` varchar(50) NOT NULL,
  `kapasitas` int(5) NOT NULL,
  `terisi` int(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tb_area_parkir`
--

INSERT INTO `tb_area_parkir` (`id_area`, `nama_area`, `kapasitas`, `terisi`) VALUES
(1, 'Area A - Motor', 50, 0),
(2, 'Area B - Mobil', 30, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tb_audit_log`
--

CREATE TABLE `tb_audit_log` (
  `id_audit` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `aksi` varchar(50) NOT NULL,
  `tabel` varchar(50) NOT NULL,
  `id_record` varchar(50) DEFAULT NULL,
  `data_lama` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data_lama`)),
  `data_baru` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data_baru`)),
  `alasan` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `status_hasil` enum('berhasil','gagal','ditolak') NOT NULL DEFAULT 'berhasil',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tb_audit_log`
--

INSERT INTO `tb_audit_log` (`id_audit`, `id_user`, `aksi`, `tabel`, `id_record`, `data_lama`, `data_baru`, `alasan`, `ip_address`, `user_agent`, `status_hasil`, `created_at`) VALUES
(1, NULL, 'LOGIN_FAILED', 'tb_user', NULL, NULL, NULL, 'Percobaan login gagal untuk username: admin (User tidak ditemukan)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'gagal', '2026-10-20 19:41:38'),
(2, NULL, 'LOGIN_FAILED', 'tb_user', NULL, NULL, NULL, 'Percobaan login gagal untuk username: admin (User tidak ditemukan)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'gagal', '2026-10-20 19:42:05'),
(3, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:42:10'),
(4, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:43:09'),
(5, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:43:27'),
(6, 2, 'CHECKIN', 'tb_transaksi', '2', NULL, '{\"kode_tiket\":\"TKT-20261021-LNYES2\",\"id_kendaraan\":3,\"id_area\":1,\"id_slot\":1,\"id_user\":2,\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"waktu_masuk\":\"2026-10-21T02:45:01.000000Z\",\"status\":\"masuk\",\"status_pembayaran\":\"belum_bayar\",\"updated_at\":\"2026-10-21T02:45:01.000000Z\",\"created_at\":\"2026-10-21T02:45:01.000000Z\",\"id_parkir\":2}', 'Kendaraan B 2314 AP masuk ke Area A - Motor (Slot: A-01)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:45:01'),
(7, 2, 'CHECKOUT', 'tb_transaksi', '2', '{\"id_parkir\":2,\"kode_tiket\":\"TKT-20261021-LNYES2\",\"id_kendaraan\":3,\"waktu_masuk\":\"2026-10-21T02:45:01.000000Z\",\"waktu_keluar\":null,\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"durasi_jam\":null,\"biaya_total\":null,\"status\":\"masuk\",\"status_pembayaran\":\"belum_bayar\",\"catatan_koreksi\":null,\"status_koreksi\":\"none\",\"koreksi_oleh\":null,\"id_user\":2,\"id_petugas_keluar\":null,\"id_area\":1,\"id_slot\":1,\"created_at\":\"2026-10-21T02:45:01.000000Z\",\"updated_at\":\"2026-10-21T02:45:01.000000Z\"}', '{\"id_parkir\":2,\"kode_tiket\":\"TKT-20261021-LNYES2\",\"id_kendaraan\":3,\"waktu_masuk\":\"2026-10-21T02:45:01.000000Z\",\"waktu_keluar\":\"2026-10-21T02:45:37.000000Z\",\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"durasi_jam\":1,\"biaya_total\":\"2000\",\"status\":\"keluar\",\"status_pembayaran\":\"lunas\",\"catatan_koreksi\":null,\"status_koreksi\":\"none\",\"koreksi_oleh\":null,\"id_user\":2,\"id_petugas_keluar\":2,\"id_area\":1,\"id_slot\":1,\"created_at\":\"2026-10-21T02:45:01.000000Z\",\"updated_at\":\"2026-10-21T02:45:37.000000Z\"}', 'Kendaraan keluar. Total biaya: Rp 2.000 (tunai)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:45:37'),
(8, 2, 'SHIFT_SUBMIT', 'tb_penutupan_shift', '1', NULL, '{\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T00:00:00.000000Z\",\"waktu_selesai\":\"2026-10-21T02:45:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"2000\",\"total_setoran\":\"2000\",\"selisih\":\"2000\",\"bukti_setoran\":\"BUKTI ADA\",\"status\":\"perlu_pemeriksaan\",\"updated_at\":\"2026-10-21T02:46:13.000000Z\",\"created_at\":\"2026-10-21T02:46:13.000000Z\",\"id_shift\":1}', 'Pengajuan penutupan shift petugas #2. Fisik: Rp 2000, Sistem: Rp 0, Selisih: Rp 2000', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:46:13'),
(9, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:48:32'),
(10, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:48:44'),
(11, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:49:45'),
(12, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:49:51'),
(13, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:50:01'),
(14, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:50:04'),
(15, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:50:23'),
(16, 4, 'LOGIN_SUCCESS', 'tb_user', '4', NULL, NULL, 'Pengguna Andi (pelanggan) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 19:50:25'),
(17, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:50:02'),
(18, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:50:10'),
(19, 3, 'LOGIN_SUCCESS', 'tb_user', '3', NULL, NULL, 'Pengguna Pak Hendra (owner) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:50:14'),
(20, 3, 'LOGOUT', 'tb_user', '3', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:51:31'),
(21, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:51:35'),
(22, 2, 'CHECKIN', 'tb_transaksi', '3', NULL, '{\"kode_tiket\":\"TKT-20261021-NLJQZQ\",\"id_kendaraan\":4,\"id_area\":1,\"id_slot\":1,\"id_user\":2,\"id_tarif\":2,\"snapshot_tarif_per_jam\":\"5000\",\"waktu_masuk\":\"2026-10-21T04:52:26.000000Z\",\"status\":\"masuk\",\"status_pembayaran\":\"belum_bayar\",\"updated_at\":\"2026-10-21T04:52:26.000000Z\",\"created_at\":\"2026-10-21T04:52:26.000000Z\",\"id_parkir\":3}', 'Kendaraan B 1234 CD masuk ke Area A - Motor (Slot: A-01)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:52:26'),
(23, 2, 'CHECKOUT', 'tb_transaksi', '3', '{\"id_parkir\":3,\"kode_tiket\":\"TKT-20261021-NLJQZQ\",\"id_kendaraan\":4,\"waktu_masuk\":\"2026-10-21T04:52:26.000000Z\",\"waktu_keluar\":null,\"id_tarif\":2,\"snapshot_tarif_per_jam\":\"5000\",\"durasi_jam\":null,\"biaya_total\":null,\"status\":\"masuk\",\"status_pembayaran\":\"belum_bayar\",\"catatan_koreksi\":null,\"status_koreksi\":\"none\",\"koreksi_oleh\":null,\"id_user\":2,\"id_petugas_keluar\":null,\"id_area\":1,\"id_slot\":1,\"created_at\":\"2026-10-21T04:52:26.000000Z\",\"updated_at\":\"2026-10-21T04:52:26.000000Z\"}', '{\"id_parkir\":3,\"kode_tiket\":\"TKT-20261021-NLJQZQ\",\"id_kendaraan\":4,\"waktu_masuk\":\"2026-10-21T04:52:26.000000Z\",\"waktu_keluar\":\"2026-10-21T04:53:17.000000Z\",\"id_tarif\":2,\"snapshot_tarif_per_jam\":\"5000\",\"durasi_jam\":1,\"biaya_total\":\"5000\",\"status\":\"keluar\",\"status_pembayaran\":\"lunas\",\"catatan_koreksi\":null,\"status_koreksi\":\"none\",\"koreksi_oleh\":null,\"id_user\":2,\"id_petugas_keluar\":2,\"id_area\":1,\"id_slot\":1,\"created_at\":\"2026-10-21T04:52:26.000000Z\",\"updated_at\":\"2026-10-21T04:53:17.000000Z\"}', 'Kendaraan keluar. Total biaya: Rp 5.000 (tunai)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:53:17'),
(24, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:53:22'),
(25, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:53:27'),
(26, 1, 'SHIFT_REVIEW', 'tb_penutupan_shift', '1', '{\"id_shift\":1,\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T00:00:00.000000Z\",\"waktu_selesai\":\"2026-10-21T02:45:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"2000\",\"total_setoran\":\"2000\",\"selisih\":\"2000\",\"bukti_setoran\":\"BUKTI ADA\",\"status\":\"perlu_pemeriksaan\",\"id_admin_pemeriksa\":null,\"waktu_diperiksa\":null,\"catatan_pemeriksa\":null,\"created_at\":\"2026-10-21T02:46:13.000000Z\",\"updated_at\":\"2026-10-21T02:46:13.000000Z\"}', '{\"id_shift\":1,\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T00:00:00.000000Z\",\"waktu_selesai\":\"2026-10-21T02:45:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"2000\",\"total_setoran\":\"2000\",\"selisih\":\"2000\",\"bukti_setoran\":\"BUKTI ADA\",\"status\":\"disetujui\",\"id_admin_pemeriksa\":1,\"waktu_diperiksa\":\"2026-10-21T04:53:39.000000Z\",\"catatan_pemeriksa\":null,\"created_at\":\"2026-10-21T02:46:13.000000Z\",\"updated_at\":\"2026-10-21T04:53:39.000000Z\"}', 'Pemeriksaan shift #1 oleh Admin: disetujui. Catatan: ', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:53:39'),
(27, 1, 'USER_CREATE', 'tb_user', '6', NULL, '{\"nama_lengkap\":\"Aksa hallatu\",\"username\":\"petugas2\",\"role\":\"petugas\"}', 'Admin membuat user baru: petugas2 (petugas)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:54:45'),
(28, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:54:58'),
(29, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:55:00'),
(30, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:55:03'),
(31, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:55:04'),
(32, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:55:10'),
(33, 6, 'LOGIN_SUCCESS', 'tb_user', '6', NULL, NULL, 'Pengguna Aksa hallatu (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:55:14'),
(34, 6, 'CHECKIN', 'tb_transaksi', '4', NULL, '{\"kode_tiket\":\"TKT-20261021-R1VMSZ\",\"id_kendaraan\":5,\"id_area\":1,\"id_slot\":1,\"id_user\":6,\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"waktu_masuk\":\"2026-10-21T04:55:35.000000Z\",\"status\":\"masuk\",\"status_pembayaran\":\"belum_bayar\",\"updated_at\":\"2026-10-21T04:55:35.000000Z\",\"created_at\":\"2026-10-21T04:55:35.000000Z\",\"id_parkir\":4}', 'Kendaraan B 5555 WA masuk ke Area A - Motor (Slot: A-01)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:55:35'),
(35, 6, 'CHECKIN', 'tb_transaksi', '5', NULL, '{\"kode_tiket\":\"TKT-20261021-RI5KAM\",\"id_kendaraan\":6,\"id_area\":1,\"id_slot\":18,\"id_user\":6,\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"waktu_masuk\":\"2026-10-21T04:55:56.000000Z\",\"status\":\"masuk\",\"status_pembayaran\":\"belum_bayar\",\"updated_at\":\"2026-10-21T04:55:56.000000Z\",\"created_at\":\"2026-10-21T04:55:56.000000Z\",\"id_parkir\":5}', 'Kendaraan R 3121 DS masuk ke Area A - Motor (Slot: A-18)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:55:56'),
(36, 6, 'CHECKOUT', 'tb_transaksi', '5', '{\"id_parkir\":5,\"kode_tiket\":\"TKT-20261021-RI5KAM\",\"id_kendaraan\":6,\"waktu_masuk\":\"2026-10-21T04:55:56.000000Z\",\"waktu_keluar\":null,\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"durasi_jam\":null,\"biaya_total\":null,\"status\":\"masuk\",\"status_pembayaran\":\"belum_bayar\",\"catatan_koreksi\":null,\"status_koreksi\":\"none\",\"koreksi_oleh\":null,\"id_user\":6,\"id_petugas_keluar\":null,\"id_area\":1,\"id_slot\":18,\"created_at\":\"2026-10-21T04:55:56.000000Z\",\"updated_at\":\"2026-10-21T04:55:56.000000Z\"}', '{\"id_parkir\":5,\"kode_tiket\":\"TKT-20261021-RI5KAM\",\"id_kendaraan\":6,\"waktu_masuk\":\"2026-10-21T04:55:56.000000Z\",\"waktu_keluar\":\"2026-10-21T04:56:13.000000Z\",\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"durasi_jam\":1,\"biaya_total\":\"2000\",\"status\":\"keluar\",\"status_pembayaran\":\"lunas\",\"catatan_koreksi\":null,\"status_koreksi\":\"none\",\"koreksi_oleh\":null,\"id_user\":6,\"id_petugas_keluar\":6,\"id_area\":1,\"id_slot\":18,\"created_at\":\"2026-10-21T04:55:56.000000Z\",\"updated_at\":\"2026-10-21T04:56:13.000000Z\"}', 'Kendaraan keluar. Total biaya: Rp 2.000 (tunai)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:56:13'),
(37, 6, 'CHECKOUT', 'tb_transaksi', '4', '{\"id_parkir\":4,\"kode_tiket\":\"TKT-20261021-R1VMSZ\",\"id_kendaraan\":5,\"waktu_masuk\":\"2026-10-21T04:55:35.000000Z\",\"waktu_keluar\":null,\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"durasi_jam\":null,\"biaya_total\":null,\"status\":\"masuk\",\"status_pembayaran\":\"belum_bayar\",\"catatan_koreksi\":null,\"status_koreksi\":\"none\",\"koreksi_oleh\":null,\"id_user\":6,\"id_petugas_keluar\":null,\"id_area\":1,\"id_slot\":1,\"created_at\":\"2026-10-21T04:55:35.000000Z\",\"updated_at\":\"2026-10-21T04:55:35.000000Z\"}', '{\"id_parkir\":4,\"kode_tiket\":\"TKT-20261021-R1VMSZ\",\"id_kendaraan\":5,\"waktu_masuk\":\"2026-10-21T04:55:35.000000Z\",\"waktu_keluar\":\"2026-10-21T04:56:22.000000Z\",\"id_tarif\":1,\"snapshot_tarif_per_jam\":\"2000\",\"durasi_jam\":1,\"biaya_total\":\"2000\",\"status\":\"keluar\",\"status_pembayaran\":\"lunas\",\"catatan_koreksi\":null,\"status_koreksi\":\"none\",\"koreksi_oleh\":null,\"id_user\":6,\"id_petugas_keluar\":6,\"id_area\":1,\"id_slot\":1,\"created_at\":\"2026-10-21T04:55:35.000000Z\",\"updated_at\":\"2026-10-21T04:56:22.000000Z\"}', 'Kendaraan keluar. Total biaya: Rp 2.000 (tunai)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 21:56:22'),
(38, 6, 'LOGOUT', 'tb_user', '6', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 22:48:30'),
(39, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:49:43'),
(40, 1, 'LOGIN_FAILED', 'tb_user', '1', NULL, NULL, 'Password salah untuk username: admin1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'gagal', '2026-10-20 22:49:48'),
(41, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:49:54'),
(42, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:50:11'),
(43, 3, 'LOGIN_SUCCESS', 'tb_user', '3', NULL, NULL, 'Pengguna Pak Hendra (owner) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:50:12'),
(44, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:50:16'),
(45, 3, 'LOGIN_SUCCESS', 'tb_user', '3', NULL, NULL, 'Pengguna Pak Hendra (owner) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:50:16'),
(46, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:50:17'),
(47, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:50:25'),
(48, 3, 'LOGIN_SUCCESS', 'tb_user', '3', NULL, NULL, 'Pengguna Pak Hendra (owner) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:50:26'),
(49, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 22:50:27'),
(50, 1, 'LOGIN_FAILED', 'tb_user', '1', NULL, NULL, 'Password salah untuk username: admin1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'gagal', '2026-10-20 22:53:54'),
(51, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 22:53:58'),
(52, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 22:54:09'),
(53, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 22:54:56'),
(54, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 22:55:04'),
(55, 4, 'LOGIN_BLOCKED', 'tb_user', '4', NULL, NULL, 'Percobaan login akun tipe pelanggan ditolak: pelanggan1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'ditolak', '2026-10-20 22:55:07'),
(56, 3, 'LOGIN_FAILED', 'tb_user', '3', NULL, NULL, 'Password salah untuk username: owner1', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'gagal', '2026-10-20 22:55:17'),
(57, 3, 'LOGIN_SUCCESS', 'tb_user', '3', NULL, NULL, 'Pengguna Pak Hendra (owner) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 22:55:35'),
(58, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 22:55:45'),
(59, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 23:01:10'),
(60, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-20 23:01:31'),
(61, 6, 'LOGIN_BLOCKED', 'tb_user', '6', NULL, NULL, 'Percobaan login pada akun dinonaktifkan: petugas2', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'ditolak', '2026-10-20 23:03:38'),
(62, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:05:18'),
(63, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:05:43'),
(64, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:07:52'),
(65, 3, 'LOGOUT', 'tb_user', '3', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:08:35'),
(66, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:08:44'),
(67, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:09:17'),
(68, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:12:55'),
(69, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:13:00'),
(70, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:13:40'),
(71, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:13:45'),
(72, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:14:09'),
(73, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:14:15'),
(74, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:14:27'),
(75, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36', 'berhasil', '2026-10-20 23:14:33'),
(76, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:34:00'),
(77, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:34:23'),
(78, 3, 'LOGIN_SUCCESS', 'tb_user', '3', NULL, NULL, 'Pengguna Pak Hendra (owner) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:34:27'),
(79, 3, 'LOGOUT', 'tb_user', '3', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:34:35'),
(80, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:34:38'),
(81, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:46:48'),
(82, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:46:51'),
(83, 2, 'SHIFT_SUBMIT', 'tb_penutupan_shift', '2', NULL, '{\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T06:46:00.000000Z\",\"waktu_selesai\":\"2026-10-21T06:46:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"0\",\"total_setoran\":\"0\",\"selisih\":\"0\",\"bukti_setoran\":null,\"status\":\"diajukan\",\"updated_at\":\"2026-10-21T06:47:11.000000Z\",\"created_at\":\"2026-10-21T06:47:11.000000Z\",\"id_shift\":2}', 'Pengajuan penutupan shift petugas #2. Fisik: Rp 0, Sistem: Rp 0, Selisih: Rp 0', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:47:11'),
(84, 2, 'SHIFT_SUBMIT', 'tb_penutupan_shift', '3', NULL, '{\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T06:47:00.000000Z\",\"waktu_selesai\":\"2026-10-21T06:47:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"8000\",\"total_setoran\":\"7000\",\"selisih\":\"8000\",\"bukti_setoran\":null,\"status\":\"perlu_pemeriksaan\",\"updated_at\":\"2026-10-21T06:47:35.000000Z\",\"created_at\":\"2026-10-21T06:47:35.000000Z\",\"id_shift\":3}', 'Pengajuan penutupan shift petugas #2. Fisik: Rp 8000, Sistem: Rp 0, Selisih: Rp 8000', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:47:35'),
(85, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:47:45'),
(86, 3, 'LOGIN_SUCCESS', 'tb_user', '3', NULL, NULL, 'Pengguna Pak Hendra (owner) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:47:47'),
(87, 3, 'SHIFT_REVIEW', 'tb_penutupan_shift', '2', '{\"id_shift\":2,\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T06:46:00.000000Z\",\"waktu_selesai\":\"2026-10-21T06:46:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"0\",\"total_setoran\":\"0\",\"selisih\":\"0\",\"bukti_setoran\":null,\"status\":\"diajukan\",\"id_admin_pemeriksa\":null,\"waktu_diperiksa\":null,\"catatan_pemeriksa\":null,\"created_at\":\"2026-10-21T06:47:11.000000Z\",\"updated_at\":\"2026-10-21T06:47:11.000000Z\"}', '{\"id_shift\":2,\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T06:46:00.000000Z\",\"waktu_selesai\":\"2026-10-21T06:46:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"0\",\"total_setoran\":\"0\",\"selisih\":\"0\",\"bukti_setoran\":null,\"status\":\"disetujui\",\"id_admin_pemeriksa\":3,\"waktu_diperiksa\":\"2026-10-21T06:47:55.000000Z\",\"catatan_pemeriksa\":null,\"created_at\":\"2026-10-21T06:47:11.000000Z\",\"updated_at\":\"2026-10-21T06:47:55.000000Z\"}', 'Pemeriksaan shift #2 oleh Admin: disetujui. Catatan: ', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:47:55'),
(88, 3, 'SHIFT_REVIEW', 'tb_penutupan_shift', '3', '{\"id_shift\":3,\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T06:47:00.000000Z\",\"waktu_selesai\":\"2026-10-21T06:47:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"8000\",\"total_setoran\":\"7000\",\"selisih\":\"8000\",\"bukti_setoran\":null,\"status\":\"perlu_pemeriksaan\",\"id_admin_pemeriksa\":null,\"waktu_diperiksa\":null,\"catatan_pemeriksa\":null,\"created_at\":\"2026-10-21T06:47:35.000000Z\",\"updated_at\":\"2026-10-21T06:47:35.000000Z\"}', '{\"id_shift\":3,\"id_petugas\":2,\"waktu_mulai\":\"2026-10-21T06:47:00.000000Z\",\"waktu_selesai\":\"2026-10-21T06:47:00.000000Z\",\"jumlah_kendaraan_masuk\":0,\"jumlah_kendaraan_keluar\":0,\"jumlah_sesi_valid\":0,\"total_tagihan\":\"0\",\"total_tunai_sistem\":\"0\",\"total_nontunai_sistem\":\"0\",\"total_tunai_fisik\":\"8000\",\"total_setoran\":\"7000\",\"selisih\":\"8000\",\"bukti_setoran\":null,\"status\":\"ditolak\",\"id_admin_pemeriksa\":3,\"waktu_diperiksa\":\"2026-10-21T06:47:58.000000Z\",\"catatan_pemeriksa\":null,\"created_at\":\"2026-10-21T06:47:35.000000Z\",\"updated_at\":\"2026-10-21T06:47:58.000000Z\"}', 'Pemeriksaan shift #3 oleh Admin: ditolak. Catatan: ', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:47:58'),
(89, 3, 'LOGOUT', 'tb_user', '3', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:48:51'),
(90, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:51:54'),
(91, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:52:06'),
(92, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-20 23:52:08'),
(93, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-21 00:06:29'),
(94, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-21 00:06:40'),
(95, 1, 'LOGIN_SUCCESS', 'tb_user', '1', NULL, NULL, 'Pengguna Budi Santoso (admin) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.7', 'berhasil', '2026-10-21 00:07:07'),
(96, 1, 'LOGOUT', 'tb_user', '1', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-21 00:07:30'),
(97, 2, 'LOGIN_SUCCESS', 'tb_user', '2', NULL, NULL, 'Pengguna Siti Aminah (petugas) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-21 00:07:32'),
(98, 2, 'LOGOUT', 'tb_user', '2', NULL, NULL, 'Pengguna logout dari sistem.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-21 00:07:34'),
(99, 3, 'LOGIN_SUCCESS', 'tb_user', '3', NULL, NULL, 'Pengguna Pak Hendra (owner) berhasil login.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', 'berhasil', '2026-10-21 00:07:37');

-- --------------------------------------------------------

--
-- Table structure for table `tb_kendaraan`
--

CREATE TABLE `tb_kendaraan` (
  `id_kendaraan` int(11) NOT NULL,
  `plat_nomor` varchar(15) NOT NULL,
  `jenis_kendaraan` varchar(20) NOT NULL,
  `warna` varchar(20) DEFAULT NULL,
  `pemilik` varchar(100) DEFAULT NULL,
  `id_user` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tb_kendaraan`
--

INSERT INTO `tb_kendaraan` (`id_kendaraan`, `plat_nomor`, `jenis_kendaraan`, `warna`, `pemilik`, `id_user`) VALUES
(1, 'M 1234 AB', 'motor', 'Hitam', 'Andi', 4),
(2, 'M 5678 CD', 'mobil', 'Putih', 'Rina', 5),
(3, 'B 2314 AP', 'motor', 'merah', NULL, 2),
(4, 'B 1234 CD', 'mobil', 'variasi', NULL, 2),
(5, 'B 5555 WA', 'motor', NULL, NULL, 6),
(6, 'R 3121 DS', 'motor', 'emas', NULL, 6);

-- --------------------------------------------------------

--
-- Table structure for table `tb_log_aktivitas`
--

CREATE TABLE `tb_log_aktivitas` (
  `id_log` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `aktivitas` varchar(100) NOT NULL,
  `waktu_aktivitas` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tb_log_aktivitas`
--

INSERT INTO `tb_log_aktivitas` (`id_log`, `id_user`, `aktivitas`, `waktu_aktivitas`) VALUES
(1, 2, 'Kendaraan keluar, id_parkir=1', '2026-10-21 08:40:28');

-- --------------------------------------------------------

--
-- Table structure for table `tb_pembayaran`
--

CREATE TABLE `tb_pembayaran` (
  `id_pembayaran` int(11) NOT NULL,
  `id_parkir` int(11) NOT NULL,
  `kode_pembayaran` varchar(50) NOT NULL,
  `nominal` decimal(10,0) NOT NULL,
  `metode` enum('tunai','qris','transfer','kartu') NOT NULL DEFAULT 'tunai',
  `status` enum('menunggu','lunas','gagal','batal') NOT NULL DEFAULT 'menunggu',
  `referensi_transaksi` varchar(100) DEFAULT NULL,
  `waktu_bayar` datetime NOT NULL,
  `waktu_konfirmasi` datetime DEFAULT NULL,
  `id_petugas` int(11) DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tb_pembayaran`
--

INSERT INTO `tb_pembayaran` (`id_pembayaran`, `id_parkir`, `kode_pembayaran`, `nominal`, `metode`, `status`, `referensi_transaksi`, `waktu_bayar`, `waktu_konfirmasi`, `id_petugas`, `catatan`, `created_at`, `updated_at`) VALUES
(1, 1, 'PAY-20261021-0001', 2000, 'tunai', 'lunas', 'MANUAL-CASH-INITIAL', '2026-10-21 08:40:28', '2026-10-21 08:40:28', 2, 'Pembayaran tunai transaksi awal', '2026-10-21 01:40:28', '2026-10-21 01:40:28'),
(2, 2, 'PAY-20261021-TG23QK', 2000, 'tunai', 'lunas', 'PAY-EK5YEM91', '2026-10-21 02:45:37', '2026-10-21 02:45:37', 2, NULL, '2026-10-20 19:45:37', '2026-10-20 19:45:37'),
(3, 3, 'PAY-20261021-PBWSME', 5000, 'tunai', 'lunas', 'PAY-C69YFSHJ', '2026-10-21 04:53:17', '2026-10-21 04:53:17', 2, NULL, '2026-10-20 21:53:17', '2026-10-20 21:53:17'),
(4, 5, 'PAY-20261021-XADENK', 2000, 'tunai', 'lunas', 'PAY-EJFITKO8', '2026-10-21 04:56:13', '2026-10-21 04:56:13', 6, NULL, '2026-10-20 21:56:13', '2026-10-20 21:56:13'),
(5, 4, 'PAY-20261021-NNFOSG', 2000, 'tunai', 'lunas', 'PAY-EJUDUI79', '2026-10-21 04:56:22', '2026-10-21 04:56:22', 6, NULL, '2026-10-20 21:56:22', '2026-10-20 21:56:22');

-- --------------------------------------------------------

--
-- Table structure for table `tb_pengaturan`
--

CREATE TABLE `tb_pengaturan` (
  `id_setting` int(11) NOT NULL,
  `kunci` varchar(50) NOT NULL,
  `nilai` text NOT NULL,
  `deskripsi` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tb_pengaturan`
--

INSERT INTO `tb_pengaturan` (`id_setting`, `kunci`, `nilai`, `deskripsi`, `created_at`, `updated_at`) VALUES
(1, 'masa_tenggang_reservasi_menit', '15', 'Masa tenggang kedatangan reservasi sebelum ditandai no-show (menit)', '2026-10-20 19:19:57', '2026-10-20 19:19:57'),
(2, 'pembulatan_durasi_menit', '60', 'Pembulatan durasi parkir ke atas (menit)', '2026-10-20 19:19:57', '2026-10-20 19:19:57'),
(3, 'denda_tiket_hilang', '25000', 'Biaya penanganan tiket hilang (Rupiah)', '2026-10-20 19:19:57', '2026-10-20 19:19:57');

-- --------------------------------------------------------

--
-- Table structure for table `tb_penutupan_shift`
--

CREATE TABLE `tb_penutupan_shift` (
  `id_shift` int(11) NOT NULL,
  `id_petugas` int(11) NOT NULL,
  `waktu_mulai` datetime NOT NULL,
  `waktu_selesai` datetime NOT NULL,
  `jumlah_kendaraan_masuk` int(11) NOT NULL DEFAULT 0,
  `jumlah_kendaraan_keluar` int(11) NOT NULL DEFAULT 0,
  `jumlah_sesi_valid` int(11) NOT NULL DEFAULT 0,
  `total_tagihan` decimal(12,0) NOT NULL DEFAULT 0,
  `total_tunai_sistem` decimal(12,0) NOT NULL DEFAULT 0,
  `total_nontunai_sistem` decimal(12,0) NOT NULL DEFAULT 0,
  `total_tunai_fisik` decimal(12,0) NOT NULL DEFAULT 0,
  `total_setoran` decimal(12,0) NOT NULL DEFAULT 0,
  `selisih` decimal(12,0) NOT NULL DEFAULT 0,
  `bukti_setoran` varchar(255) DEFAULT NULL,
  `status` enum('draft','diajukan','disetujui','perlu_pemeriksaan','ditolak') NOT NULL DEFAULT 'draft',
  `id_admin_pemeriksa` int(11) DEFAULT NULL,
  `waktu_diperiksa` datetime DEFAULT NULL,
  `catatan_pemeriksa` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tb_penutupan_shift`
--

INSERT INTO `tb_penutupan_shift` (`id_shift`, `id_petugas`, `waktu_mulai`, `waktu_selesai`, `jumlah_kendaraan_masuk`, `jumlah_kendaraan_keluar`, `jumlah_sesi_valid`, `total_tagihan`, `total_tunai_sistem`, `total_nontunai_sistem`, `total_tunai_fisik`, `total_setoran`, `selisih`, `bukti_setoran`, `status`, `id_admin_pemeriksa`, `waktu_diperiksa`, `catatan_pemeriksa`, `created_at`, `updated_at`) VALUES
(1, 2, '2026-10-21 00:00:00', '2026-10-21 02:45:00', 0, 0, 0, 0, 0, 0, 2000, 2000, 2000, 'BUKTI ADA', 'disetujui', 1, '2026-10-21 04:53:39', NULL, '2026-10-20 19:46:13', '2026-10-20 21:53:39'),
(2, 2, '2026-10-21 06:46:00', '2026-10-21 06:46:00', 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 'disetujui', 3, '2026-10-21 06:47:55', NULL, '2026-10-20 23:47:11', '2026-10-20 23:47:55'),
(3, 2, '2026-10-21 06:47:00', '2026-10-21 06:47:00', 0, 0, 0, 0, 0, 0, 8000, 7000, 8000, NULL, 'ditolak', 3, '2026-10-21 06:47:58', NULL, '2026-10-20 23:47:35', '2026-10-20 23:47:58');

-- --------------------------------------------------------

--
-- Table structure for table `tb_reservasi`
--

CREATE TABLE `tb_reservasi` (
  `id_reservasi` int(11) NOT NULL,
  `kode_reservasi` varchar(40) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_kendaraan` int(11) NOT NULL,
  `id_slot` int(11) NOT NULL,
  `waktu_booking` datetime NOT NULL,
  `jadwal_kedatangan` datetime NOT NULL,
  `batas_kedatangan` datetime NOT NULL,
  `waktu_masuk_aktual` datetime DEFAULT NULL,
  `waktu_batal` datetime DEFAULT NULL,
  `alasan_batal` text DEFAULT NULL,
  `status` enum('dipesan','masuk','selesai','noshow','dibatalkan') NOT NULL DEFAULT 'dipesan',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tb_slot_parkir`
--

CREATE TABLE `tb_slot_parkir` (
  `id_slot` int(11) NOT NULL,
  `id_area` int(11) NOT NULL,
  `kode_slot` varchar(20) NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','lainnya') NOT NULL,
  `status` enum('tersedia','dipesan','terisi','perawatan','tidak_aktif') NOT NULL DEFAULT 'tersedia',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tb_slot_parkir`
--

INSERT INTO `tb_slot_parkir` (`id_slot`, `id_area`, `kode_slot`, `jenis_kendaraan`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'A-01', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 21:56:22'),
(2, 1, 'A-02', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(3, 1, 'A-03', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(4, 1, 'A-04', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(5, 1, 'A-05', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(6, 1, 'A-06', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(7, 1, 'A-07', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(8, 1, 'A-08', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(9, 1, 'A-09', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(10, 1, 'A-10', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(11, 1, 'A-11', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(12, 1, 'A-12', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(13, 1, 'A-13', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(14, 1, 'A-14', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(15, 1, 'A-15', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(16, 1, 'A-16', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(17, 1, 'A-17', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(18, 1, 'A-18', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 21:56:13'),
(19, 1, 'A-19', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(20, 1, 'A-20', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(21, 1, 'A-21', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(22, 1, 'A-22', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(23, 1, 'A-23', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(24, 1, 'A-24', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(25, 1, 'A-25', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(26, 1, 'A-26', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(27, 1, 'A-27', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(28, 1, 'A-28', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(29, 1, 'A-29', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(30, 1, 'A-30', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(31, 1, 'A-31', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(32, 1, 'A-32', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(33, 1, 'A-33', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(34, 1, 'A-34', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(35, 1, 'A-35', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(36, 1, 'A-36', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(37, 1, 'A-37', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(38, 1, 'A-38', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(39, 1, 'A-39', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(40, 1, 'A-40', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(41, 1, 'A-41', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(42, 1, 'A-42', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(43, 1, 'A-43', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(44, 1, 'A-44', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(45, 1, 'A-45', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(46, 1, 'A-46', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(47, 1, 'A-47', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(48, 1, 'A-48', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(49, 1, 'A-49', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(50, 1, 'A-50', 'motor', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(51, 2, 'B-01', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(52, 2, 'B-02', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(53, 2, 'B-03', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(54, 2, 'B-04', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(55, 2, 'B-05', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(56, 2, 'B-06', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(57, 2, 'B-07', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(58, 2, 'B-08', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(59, 2, 'B-09', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(60, 2, 'B-10', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(61, 2, 'B-11', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(62, 2, 'B-12', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(63, 2, 'B-13', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(64, 2, 'B-14', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(65, 2, 'B-15', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(66, 2, 'B-16', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(67, 2, 'B-17', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(68, 2, 'B-18', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(69, 2, 'B-19', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(70, 2, 'B-20', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(71, 2, 'B-21', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(72, 2, 'B-22', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(73, 2, 'B-23', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(74, 2, 'B-24', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(75, 2, 'B-25', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(76, 2, 'B-26', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(77, 2, 'B-27', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(78, 2, 'B-28', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(79, 2, 'B-29', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56'),
(80, 2, 'B-30', 'mobil', 'tersedia', '2026-10-20 19:19:56', '2026-10-20 19:19:56');

-- --------------------------------------------------------

--
-- Table structure for table `tb_tarif`
--

CREATE TABLE `tb_tarif` (
  `id_tarif` int(11) NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','lainnya') NOT NULL,
  `tarif_per_jam` decimal(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tb_tarif`
--

INSERT INTO `tb_tarif` (`id_tarif`, `jenis_kendaraan`, `tarif_per_jam`) VALUES
(1, 'motor', 2000),
(2, 'mobil', 5000),
(3, 'lainnya', 3000);

-- --------------------------------------------------------

--
-- Table structure for table `tb_transaksi`
--

CREATE TABLE `tb_transaksi` (
  `id_parkir` int(11) NOT NULL,
  `kode_tiket` varchar(40) DEFAULT NULL,
  `id_kendaraan` int(11) NOT NULL,
  `waktu_masuk` datetime NOT NULL,
  `waktu_keluar` datetime DEFAULT NULL,
  `id_tarif` int(11) NOT NULL,
  `snapshot_tarif_per_jam` decimal(10,0) DEFAULT NULL,
  `durasi_jam` int(5) DEFAULT NULL,
  `biaya_total` decimal(10,0) DEFAULT NULL,
  `status` enum('masuk','keluar') NOT NULL DEFAULT 'masuk',
  `status_pembayaran` enum('belum_bayar','lunas','gratis','dibatalkan') NOT NULL DEFAULT 'belum_bayar',
  `catatan_koreksi` text DEFAULT NULL,
  `status_koreksi` enum('none','pending','disetujui','ditolak') NOT NULL DEFAULT 'none',
  `koreksi_oleh` int(11) DEFAULT NULL,
  `id_user` int(11) NOT NULL,
  `id_petugas_keluar` int(11) DEFAULT NULL,
  `id_area` int(11) NOT NULL,
  `id_slot` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tb_transaksi`
--

INSERT INTO `tb_transaksi` (`id_parkir`, `kode_tiket`, `id_kendaraan`, `waktu_masuk`, `waktu_keluar`, `id_tarif`, `snapshot_tarif_per_jam`, `durasi_jam`, `biaya_total`, `status`, `status_pembayaran`, `catatan_koreksi`, `status_koreksi`, `koreksi_oleh`, `id_user`, `id_petugas_keluar`, `id_area`, `id_slot`, `created_at`, `updated_at`) VALUES
(1, 'TKT-20261021-0001', 1, '2026-10-21 08:07:48', '2026-10-21 08:40:28', 1, 2000, 1, 2000, 'keluar', 'lunas', NULL, 'none', NULL, 2, 2, 1, 1, '2026-10-21 01:07:48', '2026-10-21 01:40:28'),
(2, 'TKT-20261021-LNYES2', 3, '2026-10-21 02:45:01', '2026-10-21 02:45:37', 1, 2000, 1, 2000, 'keluar', 'lunas', NULL, 'none', NULL, 2, 2, 1, 1, '2026-10-20 19:45:01', '2026-10-20 19:45:37'),
(3, 'TKT-20261021-NLJQZQ', 4, '2026-10-21 04:52:26', '2026-10-21 04:53:17', 2, 5000, 1, 5000, 'keluar', 'lunas', NULL, 'none', NULL, 2, 2, 1, 1, '2026-10-20 21:52:26', '2026-10-20 21:53:17'),
(4, 'TKT-20261021-R1VMSZ', 5, '2026-10-21 04:55:35', '2026-10-21 04:56:22', 1, 2000, 1, 2000, 'keluar', 'lunas', NULL, 'none', NULL, 6, 6, 1, 1, '2026-10-20 21:55:35', '2026-10-20 21:56:22'),
(5, 'TKT-20261021-RI5KAM', 6, '2026-10-21 04:55:56', '2026-10-21 04:56:13', 1, 2000, 1, 2000, 'keluar', 'lunas', NULL, 'none', NULL, 6, 6, 1, 18, '2026-10-20 21:55:56', '2026-10-20 21:56:13');

-- --------------------------------------------------------

--
-- Table structure for table `tb_user`
--

CREATE TABLE `tb_user` (
  `id_user` int(11) NOT NULL,
  `nama_lengkap` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` enum('admin','petugas','pelanggan','owner') NOT NULL,
  `status_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tb_user`
--

INSERT INTO `tb_user` (`id_user`, `nama_lengkap`, `username`, `password`, `role`, `status_aktif`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Budi Santoso', 'admin1', '$2y$12$AcGyacTKMY/zSLBDYv5RBuMyqzwwxfd15rgw/gyLrhl99exuHv2n6', 'admin', 1, NULL, NULL, '2026-10-20 19:42:10'),
(2, 'Siti Aminah', 'petugas1', '$2y$12$HHp5qD8HGYzY0NqhQf2tjuGDuN.bOhiYCoSc92WjYBHdrMqcS0pyG', 'petugas', 1, 'BiWS2ugn79ZhaZc7SHTJDrMR7oo4kDwmmGfjjw3UOUQ33nmk0tXbmDmwyDgu', NULL, '2026-10-20 23:08:00'),
(3, 'Pak Hendra', 'owner1', '$2y$12$adrklOd1wwSP6JBaSh8Dm.QDzY7kvblCmPo8JPSpRrrdUnienr8fW', 'owner', 1, NULL, NULL, '2026-10-20 21:50:14'),
(4, 'Andi', 'pelanggan1', '$2y$12$hjT1V0JfiZAZtm77viOb..CMXnCVd22NzJ7TkIJ3etJqQAxtTsXc6', 'pelanggan', 1, NULL, '2026-10-20 19:19:57', '2026-10-20 19:50:25'),
(5, 'Rina', 'pelanggan2', 'c72b07da279dcd31547fbce04ba65815266ae8689b0fe069ad9080502c57b264', 'pelanggan', 1, NULL, '2026-10-20 19:19:57', '2026-10-20 19:19:57'),
(6, 'Aksa hallatu', 'petugas2', '$2y$12$rTdYv6/5pRRaSB93/6pHe.Qh5JtVatOFMyFXqFGnmEVDwyMNytwLG', 'petugas', 1, NULL, '2026-10-20 21:54:45', '2026-10-20 23:04:00');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_rekap_transaksi`
-- (See below for the actual view)
--
CREATE TABLE `v_rekap_transaksi` (
`id_parkir` int(11)
,`plat_nomor` varchar(15)
,`jenis_kendaraan` varchar(20)
,`nama_area` varchar(50)
,`waktu_masuk` datetime
,`waktu_keluar` datetime
,`durasi_jam` int(5)
,`biaya_total` decimal(10,0)
,`status` enum('masuk','keluar')
);

-- --------------------------------------------------------

--
-- Structure for view `v_rekap_transaksi`
--
DROP TABLE IF EXISTS `v_rekap_transaksi`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_rekap_transaksi`  AS SELECT `t`.`id_parkir` AS `id_parkir`, `k`.`plat_nomor` AS `plat_nomor`, `k`.`jenis_kendaraan` AS `jenis_kendaraan`, `a`.`nama_area` AS `nama_area`, `t`.`waktu_masuk` AS `waktu_masuk`, `t`.`waktu_keluar` AS `waktu_keluar`, `t`.`durasi_jam` AS `durasi_jam`, `t`.`biaya_total` AS `biaya_total`, `t`.`status` AS `status` FROM ((`tb_transaksi` `t` join `tb_kendaraan` `k` on(`k`.`id_kendaraan` = `t`.`id_kendaraan`)) join `tb_area_parkir` `a` on(`a`.`id_area` = `t`.`id_area`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `tb_area_parkir`
--
ALTER TABLE `tb_area_parkir`
  ADD PRIMARY KEY (`id_area`);

--
-- Indexes for table `tb_audit_log`
--
ALTER TABLE `tb_audit_log`
  ADD PRIMARY KEY (`id_audit`),
  ADD KEY `tb_audit_log_id_user_foreign` (`id_user`);

--
-- Indexes for table `tb_kendaraan`
--
ALTER TABLE `tb_kendaraan`
  ADD PRIMARY KEY (`id_kendaraan`),
  ADD KEY `tb_kendaraan_id_user_foreign` (`id_user`);

--
-- Indexes for table `tb_log_aktivitas`
--
ALTER TABLE `tb_log_aktivitas`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `tb_log_aktivitas_id_user_foreign` (`id_user`);

--
-- Indexes for table `tb_pembayaran`
--
ALTER TABLE `tb_pembayaran`
  ADD PRIMARY KEY (`id_pembayaran`),
  ADD UNIQUE KEY `tb_pembayaran_kode_pembayaran_unique` (`kode_pembayaran`),
  ADD KEY `tb_pembayaran_id_parkir_foreign` (`id_parkir`),
  ADD KEY `tb_pembayaran_id_petugas_foreign` (`id_petugas`);

--
-- Indexes for table `tb_pengaturan`
--
ALTER TABLE `tb_pengaturan`
  ADD PRIMARY KEY (`id_setting`),
  ADD UNIQUE KEY `tb_pengaturan_kunci_unique` (`kunci`);

--
-- Indexes for table `tb_penutupan_shift`
--
ALTER TABLE `tb_penutupan_shift`
  ADD PRIMARY KEY (`id_shift`),
  ADD KEY `tb_penutupan_shift_id_petugas_foreign` (`id_petugas`),
  ADD KEY `tb_penutupan_shift_id_admin_pemeriksa_foreign` (`id_admin_pemeriksa`);

--
-- Indexes for table `tb_reservasi`
--
ALTER TABLE `tb_reservasi`
  ADD PRIMARY KEY (`id_reservasi`),
  ADD UNIQUE KEY `tb_reservasi_kode_reservasi_unique` (`kode_reservasi`),
  ADD KEY `tb_reservasi_id_user_foreign` (`id_user`),
  ADD KEY `tb_reservasi_id_kendaraan_foreign` (`id_kendaraan`),
  ADD KEY `tb_reservasi_id_slot_foreign` (`id_slot`);

--
-- Indexes for table `tb_slot_parkir`
--
ALTER TABLE `tb_slot_parkir`
  ADD PRIMARY KEY (`id_slot`),
  ADD UNIQUE KEY `tb_slot_parkir_kode_slot_unique` (`kode_slot`),
  ADD KEY `tb_slot_parkir_id_area_foreign` (`id_area`);

--
-- Indexes for table `tb_tarif`
--
ALTER TABLE `tb_tarif`
  ADD PRIMARY KEY (`id_tarif`);

--
-- Indexes for table `tb_transaksi`
--
ALTER TABLE `tb_transaksi`
  ADD PRIMARY KEY (`id_parkir`),
  ADD UNIQUE KEY `tb_transaksi_kode_tiket_unique` (`kode_tiket`),
  ADD KEY `tb_transaksi_id_kendaraan_foreign` (`id_kendaraan`),
  ADD KEY `tb_transaksi_id_area_foreign` (`id_area`),
  ADD KEY `tb_transaksi_id_user_foreign` (`id_user`),
  ADD KEY `tb_transaksi_id_tarif_foreign` (`id_tarif`),
  ADD KEY `tb_transaksi_id_slot_foreign` (`id_slot`),
  ADD KEY `tb_transaksi_id_petugas_keluar_foreign` (`id_petugas_keluar`),
  ADD KEY `tb_transaksi_koreksi_oleh_foreign` (`koreksi_oleh`);

--
-- Indexes for table `tb_user`
--
ALTER TABLE `tb_user`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `tb_user_username_unique` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tb_area_parkir`
--
ALTER TABLE `tb_area_parkir`
  MODIFY `id_area` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tb_audit_log`
--
ALTER TABLE `tb_audit_log`
  MODIFY `id_audit` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `tb_kendaraan`
--
ALTER TABLE `tb_kendaraan`
  MODIFY `id_kendaraan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tb_log_aktivitas`
--
ALTER TABLE `tb_log_aktivitas`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tb_pembayaran`
--
ALTER TABLE `tb_pembayaran`
  MODIFY `id_pembayaran` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tb_pengaturan`
--
ALTER TABLE `tb_pengaturan`
  MODIFY `id_setting` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tb_penutupan_shift`
--
ALTER TABLE `tb_penutupan_shift`
  MODIFY `id_shift` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tb_reservasi`
--
ALTER TABLE `tb_reservasi`
  MODIFY `id_reservasi` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tb_slot_parkir`
--
ALTER TABLE `tb_slot_parkir`
  MODIFY `id_slot` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `tb_tarif`
--
ALTER TABLE `tb_tarif`
  MODIFY `id_tarif` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tb_transaksi`
--
ALTER TABLE `tb_transaksi`
  MODIFY `id_parkir` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tb_user`
--
ALTER TABLE `tb_user`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tb_audit_log`
--
ALTER TABLE `tb_audit_log`
  ADD CONSTRAINT `tb_audit_log_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `tb_user` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `tb_kendaraan`
--
ALTER TABLE `tb_kendaraan`
  ADD CONSTRAINT `tb_kendaraan_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `tb_user` (`id_user`);

--
-- Constraints for table `tb_log_aktivitas`
--
ALTER TABLE `tb_log_aktivitas`
  ADD CONSTRAINT `tb_log_aktivitas_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `tb_user` (`id_user`);

--
-- Constraints for table `tb_pembayaran`
--
ALTER TABLE `tb_pembayaran`
  ADD CONSTRAINT `tb_pembayaran_id_parkir_foreign` FOREIGN KEY (`id_parkir`) REFERENCES `tb_transaksi` (`id_parkir`),
  ADD CONSTRAINT `tb_pembayaran_id_petugas_foreign` FOREIGN KEY (`id_petugas`) REFERENCES `tb_user` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `tb_penutupan_shift`
--
ALTER TABLE `tb_penutupan_shift`
  ADD CONSTRAINT `tb_penutupan_shift_id_admin_pemeriksa_foreign` FOREIGN KEY (`id_admin_pemeriksa`) REFERENCES `tb_user` (`id_user`) ON DELETE SET NULL,
  ADD CONSTRAINT `tb_penutupan_shift_id_petugas_foreign` FOREIGN KEY (`id_petugas`) REFERENCES `tb_user` (`id_user`);

--
-- Constraints for table `tb_reservasi`
--
ALTER TABLE `tb_reservasi`
  ADD CONSTRAINT `tb_reservasi_id_kendaraan_foreign` FOREIGN KEY (`id_kendaraan`) REFERENCES `tb_kendaraan` (`id_kendaraan`),
  ADD CONSTRAINT `tb_reservasi_id_slot_foreign` FOREIGN KEY (`id_slot`) REFERENCES `tb_slot_parkir` (`id_slot`),
  ADD CONSTRAINT `tb_reservasi_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `tb_user` (`id_user`);

--
-- Constraints for table `tb_slot_parkir`
--
ALTER TABLE `tb_slot_parkir`
  ADD CONSTRAINT `tb_slot_parkir_id_area_foreign` FOREIGN KEY (`id_area`) REFERENCES `tb_area_parkir` (`id_area`) ON DELETE CASCADE;

--
-- Constraints for table `tb_transaksi`
--
ALTER TABLE `tb_transaksi`
  ADD CONSTRAINT `tb_transaksi_id_area_foreign` FOREIGN KEY (`id_area`) REFERENCES `tb_area_parkir` (`id_area`),
  ADD CONSTRAINT `tb_transaksi_id_kendaraan_foreign` FOREIGN KEY (`id_kendaraan`) REFERENCES `tb_kendaraan` (`id_kendaraan`),
  ADD CONSTRAINT `tb_transaksi_id_petugas_keluar_foreign` FOREIGN KEY (`id_petugas_keluar`) REFERENCES `tb_user` (`id_user`) ON DELETE SET NULL,
  ADD CONSTRAINT `tb_transaksi_id_slot_foreign` FOREIGN KEY (`id_slot`) REFERENCES `tb_slot_parkir` (`id_slot`) ON DELETE SET NULL,
  ADD CONSTRAINT `tb_transaksi_id_tarif_foreign` FOREIGN KEY (`id_tarif`) REFERENCES `tb_tarif` (`id_tarif`),
  ADD CONSTRAINT `tb_transaksi_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `tb_user` (`id_user`),
  ADD CONSTRAINT `tb_transaksi_koreksi_oleh_foreign` FOREIGN KEY (`koreksi_oleh`) REFERENCES `tb_user` (`id_user`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
