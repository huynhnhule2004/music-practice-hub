<?php

namespace App\Support;

use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Dates are stored in UTC; "today", streaks and day buckets follow the user's own timezone.
 */
class UserClock
{
    public function __construct(private readonly User $user) {}

    public static function for(User $user): self
    {
        return new self($user);
    }

    public function timezone(): string
    {
        return $this->user->timezone ?: 'UTC';
    }

    public function now(): CarbonImmutable
    {
        return CarbonImmutable::now($this->timezone());
    }

    public function today(): CarbonImmutable
    {
        return $this->now()->startOfDay();
    }

    /** Convert a moment to the user's local wall-clock time. */
    public function local(CarbonInterface $moment): CarbonImmutable
    {
        return CarbonImmutable::instance($moment)->setTimezone($this->timezone());
    }

    /** Parse a local wall-clock string (e.g. from <input type="datetime-local">) into UTC. */
    public function parseLocal(string $value): CarbonImmutable
    {
        return CarbonImmutable::parse($value, $this->timezone())->utc();
    }

    /**
     * MySQL expression bucketing a UTC datetime column into the user's local date.
     * Uses a numeric offset so it works without MySQL's timezone tables.
     */
    public function localDateSql(string $column): string
    {
        $offset = $this->now()->format('P'); // e.g. +07:00

        return "DATE(CONVERT_TZ({$column}, '+00:00', '{$offset}'))";
    }

    /** MySQL expression for the local hour (0–23) of a UTC datetime column. */
    public function localHourSql(string $column): string
    {
        $offset = $this->now()->format('P');

        return "HOUR(CONVERT_TZ({$column}, '+00:00', '{$offset}'))";
    }
}
