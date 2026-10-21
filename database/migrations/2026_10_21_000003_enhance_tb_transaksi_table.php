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
        Schema::table('tb_transaksi', function (Blueprint $table) {
            if (!Schema::hasColumn('tb_transaksi', 'kode_tiket')) {
                $table->string('kode_tiket', 40)->nullable()->unique()->after('id_parkir');
            }
            if (!Schema::hasColumn('tb_transaksi', 'id_slot')) {
                $table->integer('id_slot')->nullable()->after('id_area');
                $table->foreign('id_slot')->references('id_slot')->on('tb_slot_parkir')->nullOnDelete();
            }
            if (!Schema::hasColumn('tb_transaksi', 'snapshot_tarif_per_jam')) {
                $table->decimal('snapshot_tarif_per_jam', 10, 0)->nullable()->after('id_tarif');
            }
            if (!Schema::hasColumn('tb_transaksi', 'id_petugas_keluar')) {
                $table->integer('id_petugas_keluar')->nullable()->after('id_user');
                $table->foreign('id_petugas_keluar')->references('id_user')->on('tb_user')->nullOnDelete();
            }
            if (!Schema::hasColumn('tb_transaksi', 'status_pembayaran')) {
                $table->enum('status_pembayaran', ['belum_bayar', 'lunas', 'gratis', 'dibatalkan'])->default('belum_bayar')->after('status');
            }
            if (!Schema::hasColumn('tb_transaksi', 'catatan_koreksi')) {
                $table->text('catatan_koreksi')->nullable()->after('status_pembayaran');
                $table->enum('status_koreksi', ['none', 'pending', 'disetujui', 'ditolak'])->default('none')->after('catatan_koreksi');
                $table->integer('koreksi_oleh')->nullable()->after('status_koreksi');
                $table->foreign('koreksi_oleh')->references('id_user')->on('tb_user')->nullOnDelete();
            }
            if (!Schema::hasColumn('tb_transaksi', 'created_at')) {
                $table->timestamps();
            }
        });

        // Backfill row #1
        DB::table('tb_transaksi')
            ->where('id_parkir', 1)
            ->update([
                'kode_tiket' => 'TKT-20261021-0001',
                'snapshot_tarif_per_jam' => 2000,
                'status_pembayaran' => 'lunas',
                'id_petugas_keluar' => 2,
                'id_slot' => 1,
                'created_at' => '2026-10-21 08:07:48',
                'updated_at' => '2026-10-21 08:40:28',
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            $table->dropForeign(['id_slot']);
            $table->dropForeign(['id_petugas_keluar']);
            $table->dropForeign(['koreksi_oleh']);
            $table->dropColumn([
                'kode_tiket',
                'id_slot',
                'snapshot_tarif_per_jam',
                'id_petugas_keluar',
                'status_pembayaran',
                'catatan_koreksi',
                'status_koreksi',
                'koreksi_oleh',
                'created_at',
                'updated_at'
            ]);
        });
    }
};

