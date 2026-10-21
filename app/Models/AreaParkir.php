<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AreaParkir extends Model
{
    use HasFactory;

    protected $table = 'tb_area_parkir';
    protected $primaryKey = 'id_area';
    public $timestamps = false;

    protected $fillable = [
        'nama_area',
        'kapasitas',
        'terisi',
    ];

    protected function casts(): array
    {
        return [
            'kapasitas' => 'integer',
            'terisi' => 'integer',
        ];
    }

    public function slots(): HasMany
    {
        return $this->hasMany(SlotParkir::class, 'id_area', 'id_area');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_area', 'id_area');
    }

    /**
     * Reconcile 'terisi' count from actual active transactions
     */
    public function reconcileTerisi(): int
    {
        $actualActive = Transaksi::where('id_area', $this->id_area)
            ->where('status', 'masuk')
            ->count();

        $this->terisi = max(0, min($this->kapasitas, $actualActive));
        $this->save();

        return $this->terisi;
    }
}

