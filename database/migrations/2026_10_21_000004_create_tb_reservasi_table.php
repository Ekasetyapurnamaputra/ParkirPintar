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
        if (!Schema::hasTable('tb_reservasi')) {
            Schema::create('tb_reservasi', function (Blueprint $table) {
                $table->integer('id_reservasi', true);
                $table->string('kode_reservasi', 40)->unique();
                $table->integer('id_user');
                $table->integer('id_kendaraan');
                $table->integer('id_slot');
                $table->dateTime('waktu_booking');
                $table->dateTime('jadwal_kedatangan');
                $table->dateTime('batas_kedatangan');
                $table->dateTime('waktu_masuk_aktual')->nullable();
                $table->dateTime('waktu_batal')->nullable();
                $table->text('alasan_batal')->nullable();
                $table->enum('status', ['dipesan', 'masuk', 'selesai', 'noshow', 'dibatalkan'])->default('dipesan');
                $table->timestamps();

                $table->foreign('id_user')->references('id_user')->on('tb_user');
                $table->foreign('id_kendaraan')->references('id_kendaraan')->on('tb_kendaraan');
                $table->foreign('id_slot')->references('id_slot')->on('tb_slot_parkir');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_reservasi');
    }
};

