<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'tb_transaksi';
    protected $primaryKey = 'id_parkir';

    protected $fillable = [
        'kode_tiket',
        'id_kendaraan',
        'id_area',
        'id_slot',
        'id_user',
        'id_petugas_keluar',
        'id_tarif',
        'snapshot_tarif_per_jam',
        'waktu_masuk',
        'waktu_keluar',
        'durasi_jam',
        'biaya_total',
        'status',
        'status_pembayaran',
        'catatan_koreksi',
        'status_koreksi',
        'koreksi_oleh',
    ];

    protected function casts(): array
    {
        return [
            'waktu_masuk' => 'datetime',
            'waktu_keluar' => 'datetime',
            'durasi_jam' => 'integer',
            'biaya_total' => 'decimal:0',
            'snapshot_tarif_per_jam' => 'decimal:0',
        ];
    }

    public function kendaraan(): BelongsTo
    {
        return $this->belongsTo(Kendaraan::class, 'id_kendaraan', 'id_kendaraan');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(AreaParkir::class, 'id_area', 'id_area');
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(SlotParkir::class, 'id_slot', 'id_slot');
    }

    public function tarif(): BelongsTo
    {
        return $this->belongsTo(Tarif::class, 'id_tarif', 'id_tarif');
    }

    public function petugasMasuk(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function petugasKeluar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_petugas_keluar', 'id_user');
    }

    public function petugasKoreksi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'koreksi_oleh', 'id_user');
    }

    public function pembayaran(): HasMany
    {
        return $this->hasMany(Pembayaran::class, 'id_parkir', 'id_parkir');
    }

    public function pembayaranSukses(): HasOne
    {
        return $this->hasOne(Pembayaran::class, 'id_parkir', 'id_parkir')->where('status', 'lunas');
    }
}

