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
        if (!Schema::hasTable('tb_audit_log')) {
            Schema::create('tb_audit_log', function (Blueprint $table) {
                $table->integer('id_audit', true);
                $table->integer('id_user')->nullable();
                $table->string('aksi', 50);
                $table->string('tabel', 50);
                $table->string('id_record', 50)->nullable();
                $table->json('data_lama')->nullable();
                $table->json('data_baru')->nullable();
                $table->text('alasan')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->enum('status_hasil', ['berhasil', 'gagal', 'ditolak'])->default('berhasil');
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('id_user')->references('id_user')->on('tb_user')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('tb_pengaturan')) {
            Schema::create('tb_pengaturan', function (Blueprint $table) {
                $table->integer('id_setting', true);
                $table->string('kunci', 50)->unique();
                $table->text('nilai');
                $table->string('deskripsi', 255)->nullable();
                $table->timestamps();
            });

            DB::table('tb_pengaturan')->insert([
                [
                    'kunci' => 'masa_tenggang_reservasi_menit',
                    'nilai' => '15',
                    'deskripsi' => 'Masa tenggang kedatangan reservasi sebelum ditandai no-show (menit)',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'kunci' => 'pembulatan_durasi_menit',
                    'nilai' => '60',
                    'deskripsi' => 'Pembulatan durasi parkir ke atas (menit)',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'kunci' => 'denda_tiket_hilang',
                    'nilai' => '25000',
                    'deskripsi' => 'Biaya penanganan tiket hilang (Rupiah)',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_pengaturan');
        Schema::dropIfExists('tb_audit_log');
    }
};

