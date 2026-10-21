<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenutupanShift extends Model
{
    use HasFactory;

    protected $table = 'tb_penutupan_shift';
    protected $primaryKey = 'id_shift';

    protected $fillable = [
        'id_petugas',
        'waktu_mulai',
        'waktu_selesai',
        'jumlah_kendaraan_masuk',
        'jumlah_kendaraan_keluar',
        'jumlah_sesi_valid',
        'total_tagihan',
        'total_tunai_sistem',
        'total_nontunai_sistem',
        'total_tunai_fisik',
        'total_setoran',
        'selisih',
        'bukti_setoran',
        'status',
        'id_admin_pemeriksa',
        'waktu_diperiksa',
        'catatan_pemeriksa',
    ];

    protected function casts(): array
    {
        return [
            'waktu_mulai' => 'datetime',
            'waktu_selesai' => 'datetime',
            'waktu_diperiksa' => 'datetime',
            'total_tagihan' => 'decimal:0',
            'total_tunai_sistem' => 'decimal:0',
            'total_nontunai_sistem' => 'decimal:0',
            'total_tunai_fisik' => 'decimal:0',
            'total_setoran' => 'decimal:0',
            'selisih' => 'decimal:0',
        ];
    }

    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_petugas', 'id_user');
    }

    public function pemeriksa(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_admin_pemeriksa', 'id_user');
    }
}

