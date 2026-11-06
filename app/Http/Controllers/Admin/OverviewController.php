<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LibraryStatus;
use App\Http\Controllers\Controller;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    public function __invoke(): Response
    {
        $today = CarbonImmutable::today();
        $from = $today->subDays(29);

        $daily = PracticeSession::query()
            ->where('start_time', '>=', $from)
            ->selectRaw('DATE(start_time) as day, COUNT(*) as sessions, SUM(duration_minutes) as minutes, COUNT(DISTINCT user_id) as users')
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $days = collect(range(0, 29))->map(function (int $i) use ($from, $daily) {
            $date = $from->addDays($i)->toDateString();
            $row = $daily->get($date);

            return [
                'date' => $date,
                'sessions' => (int) ($row->sessions ?? 0),
                'minutes' => (int) ($row->minutes ?? 0),
                'users' => (int) ($row->users ?? 0),
            ];
        });

        return Inertia::render('Admin/Overview', [
            'stats' => [
                'users' => User::count(),
                'new_users_7d' => User::where('created_at', '>=', $today->subDays(6))->count(),
                'active_users_7d' => PracticeSession::where('start_time', '>=', $today->subDays(6))->distinct()->count('user_id'),
                'sessions_30d' => (int) $days->sum('sessions'),
                'hours_30d' => round($days->sum('minutes') / 60, 1),
                'library_songs' => Song::where('library_status', LibraryStatus::Approved)->count(),
                'pending_songs' => Song::where('library_status', LibraryStatus::Pending)->count(),
                'suspended_users' => User::whereNotNull('suspended_at')->count(),
            ],
            'days' => $days,
            'recentUsers' => User::latest()->limit(5)->get(['id', 'name', 'email', 'created_at']),
            'pending' => Song::where('library_status', LibraryStatus::Pending)
                ->with(['owner:id,name', 'instrument:id,name'])
                ->oldest('updated_at')
                ->limit(5)
                ->get(['id', 'title', 'artist', 'user_id', 'instrument_id', 'updated_at']),
        ]);
    }
}
