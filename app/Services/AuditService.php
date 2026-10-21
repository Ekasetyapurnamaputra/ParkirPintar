<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    public static function log(
        string $aksi,
        string $tabel,
        ?string $idRecord = null,
        $dataLama = null,
        $dataBaru = null,
        ?string $alasan = null,
        string $statusHasil = 'berhasil',
        ?int $userId = null
    ): AuditLog {
        return AuditLog::record(
            aksi: $aksi,
            tabel: $tabel,
            idRecord: $idRecord,
            dataLama: $dataLama,
            dataBaru: $dataBaru,
            alasan: $alasan,
            statusHasil: $statusHasil,
            userId: $userId
        );
    }
}

