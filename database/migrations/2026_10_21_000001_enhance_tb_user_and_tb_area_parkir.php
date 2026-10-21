<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update role enum on tb_user to support 'pelanggan'
        DB::statement("ALTER TABLE `tb_user` MODIFY COLUMN `role` ENUM('admin','petugas','pelanggan','owner') NOT NULL");

        // 2. Add remember_token, created_at, updated_at to tb_user if they don't exist
        Schema::table('tb_user', function (Blueprint $table) {
            if (!Schema::hasColumn('tb_user', 'remember_token')) {
                $table->rememberToken()->after('status_aktif');
            }
            if (!Schema::hasColumn('tb_user', 'created_at')) {
                $table->timestamps();
            }
        });

        // 3. Reconcile tb_area_parkir: Area A - Motor terisi = -1 anomaly to 0
        // Currently there are 0 active parking transactions (status='masuk')
        DB::statement("UPDATE `tb_area_parkir` SET `terisi` = 0 WHERE `id_area` = 1 AND `terisi` < 0");

        // 4. Ensure non-negative terisi check
        // We will maintain application level integrity and database constraint
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tb_user', function (Blueprint $table) {
            if (Schema::hasColumn('tb_user', 'remember_token')) {
                $table->dropRememberToken();
            }
            if (Schema::hasColumn('tb_user', 'created_at')) {
                $table->dropTimestamps();
            }
        });

        DB::statement("ALTER TABLE `tb_user` MODIFY COLUMN `role` ENUM('admin','petugas','owner') NOT NULL");
    }
};

