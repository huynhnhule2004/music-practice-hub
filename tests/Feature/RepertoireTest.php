<?php

use App\Enums\LibraryStatus;
use App\Enums\SongStatus;
use App\Models\Instrument;
use App\Models\PracticeGoal;
use App\Models\Song;
use App\Models\User;
use App\Models\UserSong;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('a library piece can be added once', function () {
    $song = Song::factory()->create(['default_target_bpm' => 96]);

    $this->actingAs($this->user)->post(route('repertoire.store'), ['song_id' => $song->id])->assertRedirect();
    $this->actingAs($this->user)->post(route('repertoire.store'), ['song_id' => $song->id]);

    expect(UserSong::where('user_id', $this->user->id)->sole())
        ->song_id->toBe($song->id)
        ->target_bpm->toBe(96)
        ->status->toBe(SongStatus::Learning);
});

test('someone else\'s private piece cannot be added', function () {
    $private = Song::factory()->ownedBy(User::factory()->create())->create();

    $this->actingAs($this->user)->post(route('repertoire.store'), ['song_id' => $private->id])->assertForbidden();
});

test('a member can create a private piece that only they can see', function () {
    $instrument = Instrument::factory()->create();

    $this->actingAs($this->user)->post(route('repertoire.store-custom'), [
        'title' => 'My Etude',
        'instrument_id' => $instrument->id,
        'difficulty' => 'beginner',
        'default_target_bpm' => 100,
    ])->assertRedirect();

    $song = Song::firstWhere('title', 'My Etude');

    expect($song->user_id)->toBe($this->user->id)
        ->and($song->library_status)->toBe(LibraryStatus::Private)
        ->and(Song::visibleTo(User::factory()->create())->whereKey($song->id)->exists())->toBeFalse()
        ->and(Song::visibleTo($this->user)->whereKey($song->id)->exists())->toBeTrue();
});

test('a private piece can be submitted to the library for review', function () {
    $song = Song::factory()->ownedBy($this->user)->create();

    $this->actingAs($this->user)->post(route('songs.submit', $song))->assertRedirect();

    expect($song->fresh()->library_status)->toBe(LibraryStatus::Pending);
});

test('the repertoire lists only my pieces with counts per status', function () {
    UserSong::factory()->count(2)->create(['user_id' => $this->user->id]);
    UserSong::factory()->create(['user_id' => $this->user->id, 'status' => SongStatus::Mastered]);
    UserSong::factory()->create();

    $this->actingAs($this->user)
        ->get(route('repertoire.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repertoire/Index')
            ->has('entries', 3)
            ->where('counts.learning', 2)
            ->where('counts.mastered', 1));
});

test('a piece page is private to its owner', function () {
    $entry = UserSong::factory()->create();

    $this->actingAs($this->user)->get(route('repertoire.show', $entry))->assertForbidden();
});

test('a piece page shows its tempo history and active goal', function () {
    $entry = UserSong::factory()->create(['user_id' => $this->user->id]);
    PracticeGoal::factory()->create(['user_id' => $this->user->id, 'song_id' => $entry->song_id, 'target_bpm' => 120]);

    $this->actingAs($this->user)
        ->get(route('repertoire.show', $entry))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repertoire/Show')
            ->where('activeGoal.target_bpm', 120)
            ->has('tempoHistory', 0));
});

test('marking a piece mastered celebrates it', function () {
    $entry = UserSong::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->patch(route('repertoire.update', $entry), ['status' => 'mastered'])
        ->assertInertiaFlash('celebrate.kind', 'mastered');

    expect($entry->fresh()->computedProgress())->toBe(100);
});

test('the add page searches the visible library', function () {
    Song::factory()->create(['title' => 'Clair de lune']);
    Song::factory()->create(['title' => 'Arabesque']);
    Song::factory()->ownedBy(User::factory()->create())->create(['title' => 'Clair private']);

    $this->actingAs($this->user)
        ->get(route('repertoire.create', ['q' => 'Clair']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('library', 1)
            ->where('library.0.title', 'Clair de lune'));
});
