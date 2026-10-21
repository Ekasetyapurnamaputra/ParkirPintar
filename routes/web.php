<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PetugasController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
});

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::match(['get', 'post'], '/logout', [AuthController::class, 'logout'])->name('logout');

// Authenticated Gateway
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Petugas Routes
    Route::middleware(['role:petugas'])->prefix('petugas')->name('petugas.')->group(function () {
        Route::get('/dashboard', [PetugasController::class, 'dashboard'])->name('dashboard');
        Route::post('/masuk', [PetugasController::class, 'prosesMasuk'])->name('masuk');
        Route::get('/hitung-keluar', [PetugasController::class, 'hitungKeluar'])->name('hitungKeluar');
        Route::post('/keluar', [PetugasController::class, 'prosesKeluar'])->name('keluar');
        Route::post('/koreksi', [PetugasController::class, 'ajukanKoreksi'])->name('koreksi');
        Route::post('/shift', [PetugasController::class, 'penutupanShift'])->name('shift');
        Route::get('/shift-riwayat', [PetugasController::class, 'riwayatShift'])->name('shiftRiwayat');
    });

    // Admin & Owner Routes
    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/users', [AdminController::class, 'users'])->name('users');
        Route::post('/users', [AdminController::class, 'createUser'])->name('users.store');
        Route::put('/users/{id}', [AdminController::class, 'updateUser'])->name('users.update');
        Route::post('/users/{id}/toggle', [AdminController::class, 'toggleUserStatus'])->name('users.toggle');
        Route::get('/slots', [AdminController::class, 'slots'])->name('slots');
        Route::post('/slots/{id}', [AdminController::class, 'updateSlotStatus'])->name('slots.update');
        Route::get('/tarifs', [AdminController::class, 'tarifs'])->name('tarifs');
        Route::post('/tarifs/{id}', [AdminController::class, 'updateTarif'])->name('tarifs.update');
        Route::post('/pengaturan', [AdminController::class, 'updateSetting'])->name('pengaturan.update');
        Route::get('/transaksi', [AdminController::class, 'transaksi'])->name('transaksi');
        Route::post('/transaksi/{id}/koreksi', [AdminController::class, 'tanganiKoreksi'])->name('transaksi.koreksi');
        Route::get('/shifts', [AdminController::class, 'shifts'])->name('shifts');
        Route::post('/shifts/{id}/tinjau', [AdminController::class, 'tinjauShift'])->name('shifts.tinjau');
        Route::get('/rekonsiliasi', [AdminController::class, 'rekonsiliasi'])->name('rekonsiliasi');
        Route::get('/pendapatan', [AdminController::class, 'pendapatan'])->name('pendapatan');
        Route::get('/audit-logs', [AdminController::class, 'auditLogs'])->name('auditLogs');
    });
});
