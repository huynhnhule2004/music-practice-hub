<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Services\InsightsService;
use App\Support\UserClock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function __invoke(Request $request, InsightsService $insights): Response
    {
        $user = $request->user();
        $clock = UserClock::for($user);

        $filters = $request->validate([
            'song' => ['nullable', 'integer'],
            'instrument' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $sessions = PracticeSession::query()
            ->where('user_id', $user->id)
            ->with(['song:id,title,artist', 'instrument:id,name'])
            ->when($filters['song'] ?? null, fn ($q, $id) => $q->where('song_id', $id))
            ->when($filters['instrument'] ?? null, fn ($q, $id) => $q->where('instrument_id', $id))
            ->when($filters['from'] ?? null, fn ($q, $d) => $q->where('start_time', '>=', $clock->parseLocal($d.' 00:00')))
            ->when($filters['to'] ?? null, fn ($q, $d) => $q->where('start_time', '<', $clock->parseLocal($d.' 00:00')->addDay()))
            ->latest('start_time')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (PracticeSession $s) => [
                ...$s->only(['id', 'song_id', 'instrument_id', 'duration_minutes', 'achieved_bpm', 'rating', 'notes']),
                'start_time' => $clock->local($s->start_time)->format('Y-m-d\TH:i'),
                'local_date' => $clock->local($s->start_time)->toDateString(),
                'song' => $s->song?->only(['id', 'title', 'artist']),
                'instrument' => $s->instrument?->only(['id', 'name']),
            ]);

        $practisedSongIds = PracticeSession::where('user_id', $user->id)->distinct()->pluck('song_id');

        return Inertia::render('History/Index', [
            'sessions' => Inertia::scroll($sessions),
            'filters' => (object) array_filter($filters),
            'heatmap' => Inertia::defer(fn () => $insights->yearHeatmap($user)),
            'dailyGoal' => $user->daily_goal_minutes ?: 30,
            'today' => $clock->today()->toDateString(),
            'songs' => Song::whereIn('id', $practisedSongIds)->orderBy('title')->get(['id', 'title', 'artist', 'instrument_id']),
            'pickerSongs' => Song::visibleTo($user)->orderBy('title')->get(['id', 'title', 'artist', 'instrument_id']),
            'instruments' => Instrument::orderBy('name')->get(['id', 'name']),
        ]);
    }
}
