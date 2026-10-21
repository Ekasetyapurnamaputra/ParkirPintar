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
        if (!Schema::hasTable('tb_slot_parkir')) {
            Schema::create('tb_slot_parkir', function (Blueprint $table) {
                $table->integer('id_slot', true);
                $table->integer('id_area');
                $table->string('kode_slot', 20)->unique();
                $table->enum('jenis_kendaraan', ['motor', 'mobil', 'lainnya']);
                $table->enum('status', ['tersedia', 'dipesan', 'terisi', 'perawatan', 'tidak_aktif'])->default('tersedia');
                $table->timestamps();

                $table->foreign('id_area')->references('id_area')->on('tb_area_parkir')->onDelete('cascade');
            });

            // Generate initial slots matching existing areas
            // Area 1: Motor, 50 capacity
            $slots = [];
            for ($i = 1; $i <= 50; $i++) {
                $slots[] = [
                    'id_area' => 1,
                    'kode_slot' => sprintf('A-%02d', $i),
                    'jenis_kendaraan' => 'motor',
                    'status' => 'tersedia',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Area 2: Mobil, 30 capacity
            for ($i = 1; $i <= 30; $i++) {
                $slots[] = [
                    'id_area' => 2,
                    'kode_slot' => sprintf('B-%02d', $i),
                    'jenis_kendaraan' => 'mobil',
                    'status' => 'tersedia',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('tb_slot_parkir')->insert($slots);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_slot_parkir');
    }
};

