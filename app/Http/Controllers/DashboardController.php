<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        if ($user->isAdmin() || $user->isOwner()) {
            return redirect()->route('admin.dashboard');
        } elseif ($user->isPetugas()) {
            return redirect()->route('petugas.dashboard');
        }

        // Jika peran adalah pelanggan atau peran yang tidak diizinkan, logout otomatis dan arahkan ke login
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('login')->with('error', 'Akses pelanggan telah dinonaktifkan. Silakan login menggunakan akun Admin atau Petugas.');
    }
}
