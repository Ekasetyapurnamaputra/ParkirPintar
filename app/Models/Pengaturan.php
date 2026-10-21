<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengaturan extends Model
{
    use HasFactory;

    protected $table = 'tb_pengaturan';
    protected $primaryKey = 'id_setting';

    protected $fillable = [
        'kunci',
        'nilai',
        'deskripsi',
    ];

    public static function get(string $key, $default = null): ?string
    {
        $setting = self::where('kunci', $key)->first();
        return $setting ? $setting->nilai : $default;
    }
}

