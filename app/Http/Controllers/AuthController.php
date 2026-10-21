<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            $user = Auth::user();
            if ($user && ($user->isAdmin() || $user->isOwner() || $user->isPetugas())) {
                return redirect()->route('dashboard');
            }

            // Bersihkan sesi jika peran adalah pelanggan atau sudah tidak didukung
            Auth::logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }

        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $request->validate(
            [
                'username' => 'required|string',
                'password' => 'required|string',
            ],
            [
                'username.required' => 'Username wajib diisi.',
                'username.string' => 'Username harus berupa teks.',
                'password.required' => 'Kata sandi wajib diisi.',
                'password.string' => 'Kata sandi harus berupa teks.',
            ]
        );

        $username = trim($request->input('username'));
        $password = $request->input('password');

        $user = User::where('username', $username)->first();

        if (! $user) {
            AuditService::log(
                aksi: 'LOGIN_FAILED',
                tabel: 'tb_user',
                idRecord: null,
                alasan: "Percobaan login gagal untuk username: {$username} (User tidak ditemukan)",
                statusHasil: 'gagal'
            );

            return back()->withErrors(['username' => 'Username atau password salah.'])->withInput();
        }

        // Cek jika akun pelanggan mencoba login
        if ($user->role === 'pelanggan') {
            AuditService::log(
                aksi: 'LOGIN_BLOCKED',
                tabel: 'tb_user',
                idRecord: (string) $user->id_user,
                alasan: "Percobaan login akun tipe pelanggan ditolak: {$username}",
                statusHasil: 'ditolak',
                userId: $user->id_user
            );

            return back()->withErrors(['username' => 'Akses pelanggan telah dinonaktifkan. Silakan login sebagai Admin atau Petugas.'])->withInput();
        }

        // Check if user is active
        if (! $user->status_aktif) {
            AuditService::log(
                aksi: 'LOGIN_BLOCKED',
                tabel: 'tb_user',
                idRecord: (string) $user->id_user,
                alasan: "Percobaan login pada akun dinonaktifkan: {$username}",
                statusHasil: 'ditolak',
                userId: $user->id_user
            );

            return back()->withErrors(['username' => 'Akun Anda dinonaktifkan. Hubungi administrator.'])->withInput();
        }

        // Verify password:
        // Handle legacy 64-character SHA-256 hash or standard Laravel Bcrypt hash
        $isValid = false;
        $isLegacySha256 = (strlen($user->password) === 64 && ctype_xdigit($user->password));

        if ($isLegacySha256) {
            if (hash('sha256', $password) === $user->password) {
                $isValid = true;
                // Upgrade legacy password hash to Laravel's secure Bcrypt hash
                $user->password = Hash::make($password);
                $user->save();
            }
        } else {
            try {
                $isValid = Hash::check($password, $user->password);
            } catch (\RuntimeException $e) {
                $isValid = false;
            }
        }

        if (! $isValid) {
            AuditService::log(
                aksi: 'LOGIN_FAILED',
                tabel: 'tb_user',
                idRecord: (string) $user->id_user,
                alasan: "Password salah untuk username: {$username}",
                statusHasil: 'gagal',
                userId: $user->id_user
            );

            return back()->withErrors(['password' => 'Username atau password salah.'])->withInput();
        }

        // Login user
        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        AuditService::log(
            aksi: 'LOGIN_SUCCESS',
            tabel: 'tb_user',
            idRecord: (string) $user->id_user,
            alasan: "Pengguna {$user->nama_lengkap} ({$user->role}) berhasil login.",
            userId: $user->id_user
        );

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request)
    {
        $userId = Auth::id();
        if ($userId) {
            AuditService::log(
                aksi: 'LOGOUT',
                tabel: 'tb_user',
                idRecord: (string) $userId,
                alasan: 'Pengguna logout dari sistem.',
                userId: $userId
            );
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
