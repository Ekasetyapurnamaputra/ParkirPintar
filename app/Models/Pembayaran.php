<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pembayaran extends Model
{
    use HasFactory;

    protected $table = 'tb_pembayaran';
    protected $primaryKey = 'id_pembayaran';

    protected $fillable = [
        'id_parkir',
        'kode_pembayaran',
        'nominal',
        'metode',
        'status',
        'referensi_transaksi',
        'waktu_bayar',
        'waktu_konfirmasi',
        'id_petugas',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'nominal' => 'decimal:0',
            'waktu_bayar' => 'datetime',
            'waktu_konfirmasi' => 'datetime',
        ];
    }

    public function transaksi(): BelongsTo
    {
        return $this->belongsTo(Transaksi::class, 'id_parkir', 'id_parkir');
    }

    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_petugas', 'id_user');
    }
}

