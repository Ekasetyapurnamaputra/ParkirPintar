<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservasi extends Model
{
    use HasFactory;

    protected $table = 'tb_reservasi';
    protected $primaryKey = 'id_reservasi';

    protected $fillable = [
        'kode_reservasi',
        'id_user',
        'id_kendaraan',
        'id_slot',
        'waktu_booking',
        'jadwal_kedatangan',
        'batas_kedatangan',
        'waktu_masuk_aktual',
        'waktu_batal',
        'alasan_batal',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'waktu_booking' => 'datetime',
            'jadwal_kedatangan' => 'datetime',
            'batas_kedatangan' => 'datetime',
            'waktu_masuk_aktual' => 'datetime',
            'waktu_batal' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function kendaraan(): BelongsTo
    {
        return $this->belongsTo(Kendaraan::class, 'id_kendaraan', 'id_kendaraan');
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(SlotParkir::class, 'id_slot', 'id_slot');
    }

    public function isExpired(): bool
    {
        return $this->status === 'dipesan' && now()->greaterThan($this->batas_kedatangan);
    }
}

