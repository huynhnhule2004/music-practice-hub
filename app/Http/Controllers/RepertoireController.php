<?php

namespace App\Http\Controllers;

use App\Enums\LibraryStatus;
use App\Enums\SongStatus;
use App\Models\Instrument;
use App\Models\PracticeGoal;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\UserSong;
use App\Services\GoalPresenter;
use App\Services\RepertoirePresenter;
use App\Support\UserClock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RepertoireController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $goalSongIds = PracticeGoal::active()->where('user_id', $user->id)->pluck('song_id')->all();

        $entries = UserSong::query()
            ->where('user_id', $user->id)
            ->with(['song:id,title,artist', 'instrument:id,name'])
            ->get()
            ->sortBy(fn (UserSong $e) => $e->last_practised_at?->getTimestamp() ?? 0)
            ->map(fn (UserSong $e) => RepertoirePresenter::present($e, $user, in_array($e->song_id, $goalSongIds, true)))
            ->values();

        return Inertia::render('Repertoire/Index', [
            'entries' => $entries,
            'counts' => collect(SongStatus::cases())
                ->mapWithKeys(fn (SongStatus $s) => [$s->value => $entries->where('status', $s->value)->count()]),
        ]);
    }

    /** Add a piece: search the library, or create a private one. */
    public function create(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->query('q', ''));
        $owned = UserSong::where('user_id', $user->id)->pluck('song_id');

        $library = Song::query()
            ->visibleTo($user)
            ->with('instrument:id,name')
            ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q
                ->where('title', 'like', "%{$search}%")
                ->orWhere('artist', 'like', "%{$search}%")))
            ->orderBy('title')
            ->limit(30)
            ->get(['id', 'title', 'artist', 'genre', 'difficulty', 'instrument_id', 'default_target_bpm', 'user_id'])
            ->map(fn (Song $song) => [
                ...$song->only(['id', 'title', 'artist', 'genre', 'difficulty', 'default_target_bpm']),
                'instrument' => $song->instrument?->only(['id', 'name']),
                'is_private' => $song->user_id === $user->id,
                'in_repertoire' => $owned->contains($song->id),
            ]);

        return Inertia::render('Repertoire/Add', [
            'library' => $library,
            'search' => $search,
            'instruments' => Instrument::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /** Add an existing library song to the repertoire. */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'song_id' => ['required', 'integer', 'exists:songs,id'],
        ]);

        $song = Song::findOrFail($data['song_id']);
        $this->authorize('use', $song);

        $entry = UserSong::firstOrCreate(
            ['user_id' => $request->user()->id, 'song_id' => $song->id],
            ['instrument_id' => $song->instrument_id, 'target_bpm' => $song->default_target_bpm],
        );

        Inertia::flash('toast', ['message' => __('app.piece_added', ['title' => $song->title])]);

        return to_route('repertoire.show', $entry);
    }

    /** Create a private piece and add it to the repertoire. */
    public function storeCustom(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'artist' => ['nullable', 'string', 'max:120'],
            'genre' => ['nullable', 'string', 'max:60'],
            'instrument_id' => ['required', 'integer', 'exists:instruments,id'],
            'difficulty' => ['required', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'default_target_bpm' => ['nullable', 'integer', 'min:20', 'max:400'],
        ]);

        $user = $request->user();

        $song = new Song($data);
        $song->user_id = $user->id;
        $song->library_status = LibraryStatus::Private;
        $song->save();

        $entry = UserSong::create([
            'user_id' => $user->id,
            'song_id' => $song->id,
            'instrument_id' => $song->instrument_id,
            'target_bpm' => $song->default_target_bpm,
        ]);

        Inertia::flash('toast', ['message' => __('app.piece_added', ['title' => $song->title])]);

        return to_route('repertoire.show', $entry);
    }

    public function show(Request $request, UserSong $entry): Response
    {
        $this->authorize('view', $entry);

        $user = $request->user();
        $clock = UserClock::for($user);
        $entry->load(['song.instrument:id,name', 'instrument:id,name']);

        $sessions = PracticeSession::query()
            ->where('user_id', $user->id)
            ->where('song_id', $entry->song_id)
            ->latest('start_time')
            ->get(['id', 'start_time', 'duration_minutes', 'achieved_bpm', 'rating', 'notes', 'instrument_id']);

        $goals = PracticeGoal::query()
            ->where('user_id', $user->id)
            ->where('song_id', $entry->song_id)
            ->latest()
            ->get();

        $song = $entry->song;

        return Inertia::render('Repertoire/Show', [
            'entry' => RepertoirePresenter::present($entry, $user, $goals->contains('is_completed', false)),
            'song' => [
                ...$song->only(['id', 'title', 'artist', 'genre', 'difficulty', 'default_target_bpm']),
                'library_status' => $song->library_status->value,
                'rejection_reason' => $song->rejection_reason,
                'is_own' => $song->user_id === $user->id,
                'can_edit' => $user->can('update', $song),
                'can_submit' => $user->can('submitToLibrary', $song),
            ],
            'tempoHistory' => $sessions->whereNotNull('achieved_bpm')->sortBy('start_time')->values()
                ->map(fn ($s) => ['date' => $clock->local($s->start_time)->toDateString(), 'bpm' => $s->achieved_bpm]),
            'sessions' => $sessions->take(20)->map(fn ($s) => [
                ...$s->only(['id', 'duration_minutes', 'achieved_bpm', 'rating', 'notes']),
                'start_time' => $clock->local($s->start_time)->toIso8601String(),
            ])->values(),
            'activeGoal' => ($active = $goals->firstWhere('is_completed', false))
                ? GoalPresenter::present($active, $user, $entry)
                : null,
            'completedGoals' => $goals->where('is_completed', true)->values()
                ->map(fn ($g) => GoalPresenter::present($g, $user, $entry)),
            'instruments' => Instrument::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, UserSong $entry): RedirectResponse
    {
        $this->authorize('update', $entry);

        $data = $request->validate([
            'status' => ['sometimes', Rule::enum(SongStatus::class)],
            'target_bpm' => ['sometimes', 'nullable', 'integer', 'min:20', 'max:400'],
            'progress_percentage' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'instrument_id' => ['sometimes', 'integer', 'exists:instruments,id'],
        ]);

        $entry->update($data);

        if (($data['status'] ?? null) === SongStatus::Mastered->value) {
            Inertia::flash('celebrate', ['kind' => 'mastered', 'title' => $entry->song->title]);
        } else {
            Inertia::flash('toast', ['message' => __('app.saved')]);
        }

        return back();
    }

    public function destroy(UserSong $entry): RedirectResponse
    {
        $this->authorize('delete', $entry);

        $title = $entry->song->title;
        $entry->delete();

        Inertia::flash('toast', ['message' => __('app.piece_removed', ['title' => $title])]);

        return to_route('repertoire.index');
    }
}
