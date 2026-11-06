export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    is_admin: boolean;
    daily_goal_minutes: number;
}

export type Locale = 'en' | 'vi';

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    locale: Locale;
    translations: Record<string, unknown>;
    pendingReviews: number;
};

export interface PracticeDay {
    date: string; // Y-m-d
    minutes: number;
}

export interface Instrument {
    id: number;
    name: string;
    type?: string;
}

export interface RepertoireEntry {
    id: number;
    song_id: number;
    title: string;
    artist: string | null;
    instrument: { id: number; name: string } | null;
    status: 'learning' | 'polishing' | 'mastered';
    progress: number;
    target_bpm: number | null;
    best_bpm: number | null;
    total_minutes: number;
    last_practised_at: string | null;
    days_since: number | null;
    has_goal: boolean;
}

export interface Goal {
    id: number;
    title: string;
    song: { id: number; title: string; artist: string | null; instrument_id: number } | null;
    song_id: number;
    target_bpm: number;
    start_bpm: number | null;
    current_bpm: number | null;
    deadline_date: string;
    days_left: number;
    is_overdue: boolean;
    is_completed: boolean;
    completed_at: string | null;
    progress: number;
    bpm_per_week: number | null;
}

export interface SessionRow {
    id: number;
    song_id: number;
    instrument_id: number;
    start_time: string;
    duration_minutes: number | null;
    achieved_bpm: number | null;
    rating: number | null;
    notes: string | null;
    song?: { id: number; title: string; artist: string | null } | null;
    instrument?: { id: number; name: string } | null;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}
