<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePracticeSessionRequest;
use App\Models\Instrument;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\UserSong;
use App\Services\PracticeService;
use App\Support\UserClock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PracticeController extends Controller
{
    public function __construct(protected PracticeService $practice) {}

    /** Full-screen practice mode: timer + metronome. */
    public function practise(Request $request): Response
    {
        $user = $request->user();
        $selectedSongId = $request->integer('song') ?: null;

        return Inertia::render('Practice/Session', [
            ...$this->pickerData($request),
            'selectedSongId' => $selectedSongId,
            'suggestions' => $this->practice->suggestions($user),
            'targetBpm' => $selectedSongId
                ? UserSong::where('user_id', $user->id)->where('song_id', $selectedSongId)->value('target_bpm')
                : null,
        ]);
    }

    /** Log a session after the fact. */
    public function create(Request $request): Response
    {
        return Inertia::render('Practice/Create', [
            ...$this->pickerData($request),
            'selectedSongId' => $request->integer('song') ?: null,
        ]);
    }

    public function store(StorePracticeSessionRequest $request): RedirectResponse
    {
        $this->practice->logPracticeSession($request->user(), $request->validated());

        Inertia::flash('toast', ['message' => __('app.session_saved')]);

        return to_route('dashboard');
    }

    public function update(StorePracticeSessionRequest $request, PracticeSession $session): RedirectResponse
    {
        $this->authorize('update', $session);

        $this->practice->updateSession($session, $request->validated());

        Inertia::flash('toast', ['message' => __('app.session_updated')]);

        return back();
    }

    public function destroy(PracticeSession $session): RedirectResponse
    {
        $this->authorize('delete', $session);

        $this->practice->deleteSession($session);

        Inertia::flash('toast', [
            'message' => __('app.session_deleted'),
            'undo' => route('sessions.restore', $session->id),
        ]);

        return back();
    }

    public function restore(Request $request, int $session): RedirectResponse
    {
        $model = PracticeSession::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->findOrFail($session);

        $this->practice->restoreSession($model);

        Inertia::flash('toast', ['message' => __('app.session_restored')]);

        return back();
    }

    /**
     * Pieces in the user's repertoire first (most recent first), then the rest of the visible library.
     *
     * @return array<string, mixed>
     */
    private function pickerData(Request $request): array
    {
        $user = $request->user();

        $repertoireIds = UserSong::where('user_id', $user->id)
            ->orderByDesc('last_practised_at')
            ->pluck('song_id');

        $songs = Song::query()
            ->visibleTo($user)
            ->with('instrument:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'artist', 'instrument_id', 'default_target_bpm'])
            ->sortBy(fn (Song $song) => [
                $repertoireIds->search($song->id) === false ? 1 : 0,
                $repertoireIds->search($song->id) ?: 0,
            ])
            ->values()
            ->map(fn (Song $song) => [
                ...$song->only(['id', 'title', 'artist', 'instrument_id', 'default_target_bpm']),
                'in_repertoire' => $repertoireIds->contains($song->id),
            ]);

        return [
            'songs' => $songs,
            'instruments' => Instrument::orderBy('name')->get(['id', 'name', 'type']),
            'now' => UserClock::for($user)->now()->format('Y-m-d\TH:i'),
        ];
    }
}
