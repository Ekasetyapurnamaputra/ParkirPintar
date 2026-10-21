<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if pelanggan accounts exist or create them
        $andiId = DB::table('tb_user')->where('username', 'pelanggan1')->value('id_user');
        if (!$andiId) {
            $andiId = DB::table('tb_user')->insertGetId([
                'nama_lengkap' => 'Andi',
                'username' => 'pelanggan1',
                // SHA-256 of 'pelanggan123'
                'password' => hash('sha256', 'pelanggan123'),
                'role' => 'pelanggan',
                'status_aktif' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $rinaId = DB::table('tb_user')->where('username', 'pelanggan2')->value('id_user');
        if (!$rinaId) {
            $rinaId = DB::table('tb_user')->insertGetId([
                'nama_lengkap' => 'Rina',
                'username' => 'pelanggan2',
                // SHA-256 of 'pelanggan123'
                'password' => hash('sha256', 'pelanggan123'),
                'role' => 'pelanggan',
                'status_aktif' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Reassign vehicles to their actual customer owners
        DB::table('tb_kendaraan')->where('id_kendaraan', 1)->update(['id_user' => $andiId]);
        DB::table('tb_kendaraan')->where('id_kendaraan', 2)->update(['id_user' => $rinaId]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert vehicle ownership back to user 2 if needed
        DB::table('tb_kendaraan')->whereIn('id_kendaraan', [1, 2])->update(['id_user' => 2]);
    }
};

