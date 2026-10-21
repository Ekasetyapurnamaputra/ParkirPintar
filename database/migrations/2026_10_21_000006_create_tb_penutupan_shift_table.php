<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tb_penutupan_shift')) {
            Schema::create('tb_penutupan_shift', function (Blueprint $table) {
                $table->integer('id_shift', true);
                $table->integer('id_petugas');
                $table->dateTime('waktu_mulai');
                $table->dateTime('waktu_selesai');
                $table->integer('jumlah_kendaraan_masuk')->default(0);
                $table->integer('jumlah_kendaraan_keluar')->default(0);
                $table->integer('jumlah_sesi_valid')->default(0);
                $table->decimal('total_tagihan', 12, 0)->default(0);
                $table->decimal('total_tunai_sistem', 12, 0)->default(0);
                $table->decimal('total_nontunai_sistem', 12, 0)->default(0);
                $table->decimal('total_tunai_fisik', 12, 0)->default(0);
                $table->decimal('total_setoran', 12, 0)->default(0);
                $table->decimal('selisih', 12, 0)->default(0);
                $table->string('bukti_setoran', 255)->nullable();
                $table->enum('status', ['draft', 'diajukan', 'disetujui', 'perlu_pemeriksaan', 'ditolak'])->default('draft');
                $table->integer('id_admin_pemeriksa')->nullable();
                $table->dateTime('waktu_diperiksa')->nullable();
                $table->text('catatan_pemeriksa')->nullable();
                $table->timestamps();

                $table->foreign('id_petugas')->references('id_user')->on('tb_user');
                $table->foreign('id_admin_pemeriksa')->references('id_user')->on('tb_user')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_penutupan_shift');
    }
};

