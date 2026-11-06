<?php

namespace App\Http\Controllers;

use App\Models\PracticeGoal;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\UserSong;
use App\Services\GoalPresenter;
use App\Support\UserClock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class GoalController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $goals = PracticeGoal::query()
            ->where('user_id', $user->id)
            ->with('song:id,title,artist,instrument_id')
            ->orderBy('is_completed')
            ->orderBy('deadline_date')
            ->get();

        $entries = UserSong::where('user_id', $user->id)->whereIn('song_id', $goals->pluck('song_id'))->get()->keyBy('song_id');
        $presented = $goals->map(fn ($g) => GoalPresenter::present($g, $user, $entries->get($g->song_id)));

        return Inertia::render('Goals/Index', [
            'active' => $presented->where('is_completed', false)->values(),
            'completed' => $presented->where('is_completed', true)->values(),
            'pieces' => UserSong::where('user_id', $user->id)
                ->with('song:id,title,artist')
                ->get()
                ->map(fn ($e) => [
                    'song_id' => $e->song_id,
                    'title' => $e->song->title,
                    'artist' => $e->song->artist,
                    'best_bpm' => $e->best_bpm,
                    'target_bpm' => $e->target_bpm,
                    'has_goal' => $goals->where('song_id', $e->song_id)->contains('is_completed', false),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $today = UserClock::for($user)->today()->toDateString();

        $data = $request->validate([
            'song_id' => ['required', 'integer', 'exists:songs,id'],
            'target_bpm' => ['required', 'integer', 'min:20', 'max:400'],
            'deadline_date' => ['required', 'date', 'after_or_equal:'.$today],
            'title' => ['nullable', 'string', 'max:120'],
        ]);

        $song = Song::findOrFail($data['song_id']);
        $this->authorize('use', $song);

        if (PracticeGoal::active()->where('user_id', $user->id)->where('song_id', $song->id)->exists()) {
            throw ValidationException::withMessages(['song_id' => __('app.goal_already_active')]);
        }

        $startBpm = PracticeSession::where('user_id', $user->id)->where('song_id', $song->id)->max('achieved_bpm');

        PracticeGoal::create([
            'user_id' => $user->id,
            'song_id' => $song->id,
            'title' => ($data['title'] ?? null) ?: __('app.goal_default_title', ['bpm' => $data['target_bpm']]),
            'target_bpm' => $data['target_bpm'],
            'start_bpm' => $startBpm,
            'deadline_date' => $data['deadline_date'],
        ]);

        UserSong::firstOrCreate(
            ['user_id' => $user->id, 'song_id' => $song->id],
            ['instrument_id' => $song->instrument_id],
        )->update(['target_bpm' => $data['target_bpm']]);

        Inertia::flash('toast', ['message' => __('app.goal_created')]);

        return back();
    }

    public function update(Request $request, PracticeGoal $goal): RedirectResponse
    {
        $this->authorize('update', $goal);

        $data = $request->validate([
            'target_bpm' => ['sometimes', 'integer', 'min:20', 'max:400'],
            'deadline_date' => ['sometimes', 'date'],
            'title' => ['sometimes', 'string', 'max:120'],
            'is_completed' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('is_completed', $data)) {
            $data['completed_at'] = $data['is_completed'] ? now() : null;
        }

        $goal->update($data);

        Inertia::flash('toast', ['message' => __('app.saved')]);

        return back();
    }

    public function destroy(PracticeGoal $goal): RedirectResponse
    {
        $this->authorize('delete', $goal);

        $goal->delete();

        Inertia::flash('toast', ['message' => __('app.goal_deleted')]);

        return back();
    }
}
