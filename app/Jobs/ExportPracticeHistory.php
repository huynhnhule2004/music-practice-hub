<?php

namespace App\Jobs;

use App\Models\PracticeSession;
use App\Models\User;
use App\Support\UserClock;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

/**
 * Writes a user's full practice history to CSV without loading it all into memory (RD §3.3).
 */
class ExportPracticeHistory implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $userId) {}

    public static function pathFor(int $userId): string
    {
        return "exports/practice-history-{$userId}.csv";
    }

    public function handle(): void
    {
        $user = User::find($this->userId);

        if (! $user) {
            return;
        }

        $clock = UserClock::for($user);
        $disk = Storage::disk('local');
        $disk->makeDirectory('exports');

        $tmp = $disk->path(self::pathFor($user->id).'.tmp');
        $out = fopen($tmp, 'w');
        fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so spreadsheet apps keep Vietnamese characters intact.
        fputcsv($out, ['date', 'start_time', 'piece', 'artist', 'instrument', 'minutes', 'tempo_bpm', 'rating', 'notes']);

        PracticeSession::query()
            ->where('user_id', $user->id)
            ->with(['song:id,title,artist', 'instrument:id,name'])
            ->orderBy('start_time')
            ->lazy(500)
            ->each(function (PracticeSession $s) use ($out, $clock) {
                $local = $clock->local($s->start_time);

                fputcsv($out, [
                    $local->toDateString(),
                    $local->format('H:i'),
                    $s->song?->title,
                    $s->song?->artist,
                    $s->instrument?->name,
                    $s->duration_minutes,
                    $s->achieved_bpm,
                    $s->rating,
                    $s->notes,
                ]);
            });

        fclose($out);
        rename($tmp, $disk->path(self::pathFor($user->id)));
    }
}
