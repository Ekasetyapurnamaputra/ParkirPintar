<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SlotParkir extends Model
{
    use HasFactory;

    protected $table = 'tb_slot_parkir';
    protected $primaryKey = 'id_slot';

    protected $fillable = [
        'id_area',
        'kode_slot',
        'jenis_kendaraan',
        'status',
    ];

    public function area(): BelongsTo
    {
        return $this->belongsTo(AreaParkir::class, 'id_area', 'id_area');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_slot', 'id_slot');
    }

    public function reservasi(): HasMany
    {
        return $this->hasMany(Reservasi::class, 'id_slot', 'id_slot');
    }

    public function scopeTersedia(Builder $query): Builder
    {
        return $query->where('status', 'tersedia');
    }

    public function isAvailable(): bool
    {
        return $this->status === 'tersedia';
    }
}

