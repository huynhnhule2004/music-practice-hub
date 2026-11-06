<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LibraryStatus;
use App\Http\Controllers\Controller;
use App\Models\Instrument;
use App\Models\Song;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The shared song library: curate, edit, delete, and moderate member submissions.
 */
class LibraryController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(LibraryStatus::class)],
            'instrument' => ['nullable', 'integer'],
        ]);

        $status = $filters['status'] ?? LibraryStatus::Approved->value;

        $songs = Song::query()
            ->with(['instrument:id,name', 'owner:id,name,email'])
            ->withCount(['repertoireEntries', 'practiceSessions'])
            ->where('library_status', $status)
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($q) => $q
                ->where('title', 'like', "%{$term}%")
                ->orWhere('artist', 'like', "%{$term}%")))
            ->when($filters['instrument'] ?? null, fn ($q, $id) => $q->where('instrument_id', $id))
            ->orderBy($status === LibraryStatus::Pending->value ? 'updated_at' : 'title')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Library', [
            'songs' => $songs,
            'filters' => ['status' => $status, ...array_filter($filters)],
            'counts' => collect(LibraryStatus::cases())
                ->mapWithKeys(fn ($s) => [$s->value => Song::where('library_status', $s)->count()]),
            'instruments' => Instrument::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $song = new Song($this->validated($request));
        $song->library_status = LibraryStatus::Approved;
        $song->save();

        Inertia::flash('toast', ['message' => __('admin.song_created')]);

        return back();
    }

    public function update(Request $request, Song $song): RedirectResponse
    {
        $song->update($this->validated($request));

        Inertia::flash('toast', ['message' => __('app.saved')]);

        return back();
    }

    public function approve(Song $song): RedirectResponse
    {
        $song->library_status = LibraryStatus::Approved;
        $song->rejection_reason = null;
        $song->save();

        Inertia::flash('toast', ['message' => __('admin.song_approved', ['title' => $song->title])]);

        return back();
    }

    public function reject(Request $request, Song $song): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);

        $song->library_status = LibraryStatus::Rejected;
        $song->rejection_reason = $data['reason'];
        $song->save();

        Inertia::flash('toast', ['message' => __('admin.song_rejected', ['title' => $song->title])]);

        return back();
    }

    public function destroy(Song $song): RedirectResponse
    {
        if ($song->practiceSessions()->withTrashed()->exists()) {
            return back()->withErrors(['song' => __('admin.song_in_use')]);
        }

        $song->delete();

        Inertia::flash('toast', ['message' => __('admin.song_deleted')]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'artist' => ['nullable', 'string', 'max:120'],
            'genre' => ['nullable', 'string', 'max:60'],
            'instrument_id' => ['required', 'integer', 'exists:instruments,id'],
            'difficulty' => ['required', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'default_target_bpm' => ['nullable', 'integer', 'min:20', 'max:400'],
        ]);
    }
}
