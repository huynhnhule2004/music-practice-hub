<?php

use App\Models\PracticeGoal;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use App\Models\UserSong;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-11-06 12:00:00');
    $this->user = User::factory()->create();
    $this->song = Song::factory()->create();
});

test('a goal starts from the best tempo recorded so far', function () {
    PracticeSession::factory()->create(['user_id' => $this->user->id, 'song_id' => $this->song->id, 'achieved_bpm' => 88]);

    $this->actingAs($this->user)->post(route('goals.store'), [
        'song_id' => $this->song->id,
        'target_bpm' => 120,
        'deadline_date' => '2026-12-04',
    ])->assertSessionHasNoErrors();

    expect(PracticeGoal::sole())
        ->start_bpm->toBe(88)
        ->title->toBe('Reach ♩ = 120');
});

test('only one active goal per piece, but a new one after completing', function () {
    $payload = ['song_id' => $this->song->id, 'target_bpm' => 120, 'deadline_date' => '2026-12-04'];

    $this->actingAs($this->user)->post(route('goals.store'), $payload);
    $this->actingAs($this->user)->post(route('goals.store'), $payload)->assertSessionHasErrors('song_id');

    PracticeGoal::query()->update(['is_completed' => true]);

    $this->actingAs($this->user)->post(route('goals.store'), [...$payload, 'target_bpm' => 132])->assertSessionHasNoErrors();

    expect(PracticeGoal::count())->toBe(2);
});

test('deadlines cannot be in the past', function () {
    $this->actingAs($this->user)->post(route('goals.store'), [
        'song_id' => $this->song->id,
        'target_bpm' => 120,
        'deadline_date' => '2026-11-01',
    ])->assertSessionHasErrors('deadline_date');
});

test('the goals page shows progress and the weekly pace needed', function () {
    PracticeGoal::factory()->create([
        'user_id' => $this->user->id,
        'song_id' => $this->song->id,
        'start_bpm' => 80,
        'target_bpm' => 120,
        'deadline_date' => '2026-12-04', // 4 weeks away
    ]);
    PracticeSession::factory()->create(['user_id' => $this->user->id, 'song_id' => $this->song->id, 'achieved_bpm' => 100]);
    UserSong::factory()->create(['user_id' => $this->user->id, 'song_id' => $this->song->id, 'best_bpm' => 100]);

    $this->actingAs($this->user)
        ->get(route('goals.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Goals/Index')
            ->where('active.0.progress', 50)
            ->where('active.0.days_left', 28)
            ->where('active.0.bpm_per_week', 5));
});

test('goals belong to their owner', function () {
    $goal = PracticeGoal::factory()->create();

    $this->actingAs($this->user)->patch(route('goals.update', $goal), ['is_completed' => true])->assertForbidden();
    $this->actingAs($this->user)->delete(route('goals.destroy', $goal))->assertForbidden();
});
