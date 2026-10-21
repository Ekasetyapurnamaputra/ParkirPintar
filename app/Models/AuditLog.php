<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'tb_audit_log';
    protected $primaryKey = 'id_audit';
    public $timestamps = false;

    protected $fillable = [
        'id_user',
        'aksi',
        'tabel',
        'id_record',
        'data_lama',
        'data_baru',
        'alasan',
        'ip_address',
        'user_agent',
        'status_hasil',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'data_lama' => 'array',
            'data_baru' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    /**
     * Record an audit log entry
     */
    public static function record(
        string $aksi,
        string $tabel,
        ?string $idRecord = null,
        $dataLama = null,
        $dataBaru = null,
        ?string $alasan = null,
        string $statusHasil = 'berhasil',
        ?int $userId = null
    ): self {
        return self::create([
            'id_user' => $userId ?? Auth::id(),
            'aksi' => $aksi,
            'tabel' => $tabel,
            'id_record' => $idRecord ? (string)$idRecord : null,
            'data_lama' => $dataLama,
            'data_baru' => $dataBaru,
            'alasan' => $alasan,
            'ip_address' => Request::ip() ?? '127.0.0.1',
            'user_agent' => Request::userAgent() ?? 'CLI/System',
            'status_hasil' => $statusHasil,
            'created_at' => now(),
        ]);
    }
}

