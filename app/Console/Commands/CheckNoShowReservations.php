<?php

namespace App\Console\Commands;

use App\Services\ReservasiService;
use Illuminate\Console\Command;

class CheckNoShowReservations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'parkir:check-noshow';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Periksa dan tandai reservasi yang melewati batas kedatangan sebagai No-Show, lalu bebaskan slot';

    /**
     * Execute the console command.
     */
    public function handle(ReservasiService $service): int
    {
        $this->info('Memeriksa reservasi kedaluwarsa...');
        $count = $service->prosesKedaluwarsaNoShow();
        $this->info("Berhasil memproses {$count} reservasi No-Show.");

        return Command::SUCCESS;
    }
}

