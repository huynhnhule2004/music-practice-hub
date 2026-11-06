<?php

use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use App\Services\InsightsService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-11-06 12:00:00');
    $this->user = User::factory()->create(['timezone' => 'UTC']);
});

test('history lists my sessions newest first and can filter by piece', function () {
    $a = Song::factory()->create();
    $b = Song::factory()->create();
    PracticeSession::factory()->create(['user_id' => $this->user->id, 'song_id' => $a->id, 'start_time' => '2026-11-01 10:00:00']);
    PracticeSession::factory()->create(['user_id' => $this->user->id, 'song_id' => $b->id, 'start_time' => '2026-11-05 10:00:00']);
    PracticeSession::factory()->create(); // someone else's

    $this->actingAs($this->user)
        ->get(route('history'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('History/Index')
            ->has('sessions.data', 2)
            ->where('sessions.data.0.song_id', $b->id));

    $this->actingAs($this->user)
        ->get(route('history', ['song' => $a->id]))
        ->assertInertia(fn (Assert $page) => $page->has('sessions.data', 1)->where('filters.song', (string) $a->id));
});

test('insights are cached and busted when a session is logged', function () {
    $song = Song::factory()->create();
    PracticeSession::factory()->create(['user_id' => $this->user->id, 'song_id' => $song->id, 'start_time' => '2026-11-05 10:00:00', 'duration_minutes' => 40]);

    $first = app(InsightsService::class)->forUser($this->user);

    expect($first['summary']['minutes'])->toBe(40)
        ->and(Cache::has(InsightsService::cacheKey($this->user->id)))->toBeTrue();

    $this->actingAs($this->user)->post(route('practice.store'), [
        'song_id' => $song->id,
        'instrument_id' => $song->instrument_id,
        'start_time' => '2026-11-06 09:00',
        'duration_minutes' => 20,
    ]);

    expect(Cache::has(InsightsService::cacheKey($this->user->id)))->toBeFalse()
        ->and(app(InsightsService::class)->forUser($this->user)['summary']['minutes'])->toBe(60);
});

test('insights load as a deferred prop', function () {
    $this->actingAs($this->user)
        ->get(route('insights'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Insights/Index')
            ->missing('insights')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('insights.weeks', InsightsService::WEEKS)
                ->has('insights.byHour', 24)));
});
