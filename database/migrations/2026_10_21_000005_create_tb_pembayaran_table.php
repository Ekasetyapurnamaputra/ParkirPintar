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
        if (!Schema::hasTable('tb_pembayaran')) {
            Schema::create('tb_pembayaran', function (Blueprint $table) {
                $table->integer('id_pembayaran', true);
                $table->integer('id_parkir');
                $table->string('kode_pembayaran', 50)->unique();
                $table->decimal('nominal', 10, 0);
                $table->enum('metode', ['tunai', 'qris', 'transfer', 'kartu'])->default('tunai');
                $table->enum('status', ['menunggu', 'lunas', 'gagal', 'batal'])->default('menunggu');
                $table->string('referensi_transaksi', 100)->nullable();
                $table->dateTime('waktu_bayar');
                $table->dateTime('waktu_konfirmasi')->nullable();
                $table->integer('id_petugas')->nullable();
                $table->text('catatan')->nullable();
                $table->timestamps();

                $table->foreign('id_parkir')->references('id_parkir')->on('tb_transaksi');
                $table->foreign('id_petugas')->references('id_user')->on('tb_user')->nullOnDelete();
            });

            // Backfill payment for existing transaction #1
            $transaksi = DB::table('tb_transaksi')->where('id_parkir', 1)->first();
            if ($transaksi && $transaksi->biaya_total) {
                DB::table('tb_pembayaran')->insert([
                    'id_parkir' => 1,
                    'kode_pembayaran' => 'PAY-20261021-0001',
                    'nominal' => $transaksi->biaya_total,
                    'metode' => 'tunai',
                    'status' => 'lunas',
                    'referensi_transaksi' => 'MANUAL-CASH-INITIAL',
                    'waktu_bayar' => $transaksi->waktu_keluar ?? now(),
                    'waktu_konfirmasi' => $transaksi->waktu_keluar ?? now(),
                    'id_petugas' => 2,
                    'catatan' => 'Pembayaran tunai transaksi awal',
                    'created_at' => $transaksi->waktu_keluar ?? now(),
                    'updated_at' => $transaksi->waktu_keluar ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_pembayaran');
    }
};

