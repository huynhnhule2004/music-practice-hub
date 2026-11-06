import { Head, Link } from '@inertiajs/react';
import { CalendarCheck, Clock, Flame, Music2, Play, Plus } from 'lucide-react';
import GoalCard from '@/Components/GoalCard';
import PieceCard from '@/Components/PieceCard';
import PracticeStaff from '@/Components/PracticeStaff';
import StaffScroller from '@/Components/StaffScroller';
import { LinkButton } from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMinutes, intlLocale, useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { Goal, PageProps, PracticeDay, RepertoireEntry } from '@/types';

type RecentSession = {
    id: number;
    start_time: string;
    duration_minutes: number | null;
    achieved_bpm: number | null;
    song: { id: number; title: string; artist: string | null } | null;
    instrument: { id: number; name: string } | null;
};

type Props = PageProps<{
    dailyGoal: number;
    days: PracticeDay[];
    todayMinutes: number;
    totals: { sessions: number; minutes: number; pieces: number };
    streak: { current: number; best: number };
    nextUp: RepertoireEntry[];
    goals: Goal[];
    recentSessions: RecentSession[];
}>;

export default function Dashboard({ auth, dailyGoal, days, todayMinutes, totals, streak, nextUp, goals, recentSessions }: Props) {
    const { t, locale } = useTrans();
    const goalMet = todayMinutes >= dailyGoal;
    // Full name: which part is the "first" name differs between Vietnamese and English order.
    const firstName = auth.user.name.trim();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'good_morning' : hour < 18 ? 'good_afternoon' : 'good_evening';
    const nudge = goalMet ? t('today_done') : todayMinutes > 0 ? t('today_left', { minutes: dailyGoal - todayMinutes }) : t('today_none');

    return (
        <AuthenticatedLayout wide>
            <Head title={t('nav_today')} />

            {/* Today: the one bold, colourful block on the page */}
            <section className="bg-brand hero-glow relative overflow-hidden rounded-3xl p-6 sm:p-8">
                <HeroNotes />
                <div className="relative grid items-center gap-7 sm:grid-cols-[1fr_auto]">
                    <div>
                        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl">{t(greeting, { name: firstName })}</h1>
                        <p className="mt-1.5 text-white/85">{nudge}</p>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Link
                                href={route('practice.session')}
                                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brass px-6 text-base font-bold text-[hsl(340_40%_12%)] shadow-lg shadow-black/25 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Play className="h-5 w-5 fill-current" />
                                {todayMinutes > 0 ? t('keep_going') : t('start_practising')}
                            </Link>
                            <Link
                                href={route('practice.create')}
                                className="inline-flex h-12 items-center rounded-xl px-4 text-base font-semibold text-white/90 ring-1 ring-white/30 transition-colors hover:bg-white/10"
                            >
                                {t('log_session')}
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 sm:gap-8">
                        <GoalRing minutes={todayMinutes} goal={dailyGoal} />
                        <div className="rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/20 backdrop-blur-sm">
                            <p className="text-sm font-medium text-white/80">{t('current_streak')}</p>
                            <p className="tabular mt-0.5 inline-flex items-center gap-1 text-3xl font-bold">
                                <Flame className="h-7 w-7 fill-[hsl(36_100%_60%)] text-[hsl(20_100%_62%)]" aria-hidden="true" />
                                {streak.current}
                            </p>
                            <p className="text-xs text-white/75">{t('best_streak', { days: streak.best })}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Practise next */}
            <section className="mt-10" aria-labelledby="next-heading">
                <div className="mb-3 flex items-baseline justify-between gap-4">
                    <h2 id="next-heading" className="text-lg font-bold">
                        {t('practise_next')}
                    </h2>
                    {nextUp.length > 0 && (
                        <Link href={route('repertoire.index')} className="text-sm font-semibold text-primary hover:underline">
                            {t('see_all')}
                        </Link>
                    )}
                </div>

                {nextUp.length === 0 ? (
                    <EmptyState
                        title={t('no_pieces_yet_title')}
                        body={t('no_pieces_yet_body')}
                        action={
                            <LinkButton href={route('repertoire.create')} icon={<Plus className="h-4 w-4" />}>
                                {t('add_piece')}
                            </LinkButton>
                        }
                    />
                ) : (
                    <div className="grid gap-3 md:grid-cols-3">
                        {nextUp.map((entry) => (
                            <PieceCard key={entry.id} entry={entry} />
                        ))}
                    </div>
                )}
            </section>

            {/* The staff: four weeks at a glance */}
            <section className="mt-10" aria-labelledby="staff-heading">
                <h2 id="staff-heading" className="mb-3 text-lg font-bold">
                    {t('four_weeks')}
                </h2>
                <div className="staff-panel rounded-2xl px-3 pb-4 pt-2 sm:px-6 sm:pt-4">
                    <StaffScroller className="-mx-3 px-3 sm:mx-0 sm:px-0">
                        <PracticeStaff days={days} goal={dailyGoal} animate className="min-w-[640px]" />
                    </StaffScroller>
                </div>
                <p className="mt-2.5 text-sm text-muted-foreground">{t('staff_caption')}</p>

                <dl className="mt-6 grid grid-cols-3 gap-3">
                    <Figure tone="primary" icon={<CalendarCheck className="h-4 w-4" />} label={t('total_sessions')} value={totals.sessions} />
                    <Figure
                        tone="brass"
                        icon={<Clock className="h-4 w-4" />}
                        label={t('hours_practiced')}
                        value={(totals.minutes / 60).toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 })}
                    />
                    <Figure tone="teal" icon={<Music2 className="h-4 w-4" />} label={t('songs_learned')} value={totals.pieces} />
                </dl>
            </section>

            <div className="mt-10 grid gap-10 lg:grid-cols-2">
                {goals.length > 0 && (
                    <section aria-labelledby="goals-heading">
                        <div className="mb-3 flex items-baseline justify-between gap-4">
                            <h2 id="goals-heading" className="text-lg font-bold">
                                {t('active_goals')}
                            </h2>
                            <Link href={route('goals.index')} className="text-sm font-semibold text-primary hover:underline">
                                {t('see_all')}
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {goals.map((goal) => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    </section>
                )}

                {recentSessions.length > 0 && (
                    <section aria-labelledby="recent-heading">
                        <div className="mb-1 flex items-baseline justify-between gap-4">
                            <h2 id="recent-heading" className="text-lg font-bold">
                                {t('recent_sessions')}
                            </h2>
                            <Link href={route('history')} className="text-sm font-semibold text-primary hover:underline">
                                {t('see_all')}
                            </Link>
                        </div>
                        <ul className="divide-y divide-border">
                            {recentSessions.map((session) => (
                                <RecentRow key={session.id} session={session} />
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

/** Today's minutes as a ring that fills toward the daily goal; gold until met, then mint. */
function GoalRing({ minutes, goal }: { minutes: number; goal: number }) {
    const { t } = useTrans();
    const r = 52;
    const c = 2 * Math.PI * r;
    const pct = Math.min(minutes / goal, 1);
    const met = minutes >= goal;

    return (
        <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`${minutes} / ${goal} ${t('minutes_short')}`}>
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" stroke="rgb(255 255 255 / 0.18)" />
                <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - pct)}
                    stroke={met ? 'hsl(160 84% 60%)' : 'hsl(42 100% 62%)'}
                    className="transition-[stroke-dashoffset] duration-700"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular text-3xl font-bold leading-none tracking-tight">{minutes}</span>
                <span className="mt-1 text-xs font-medium text-white/80">{t('of_goal', { goal })}</span>
            </div>
        </div>
    );
}

/** Faint staff lines and notes drifting across the hero, purely decorative. */
function HeroNotes() {
    return (
        <svg className="pointer-events-none absolute -right-10 top-1/2 h-[140%] w-[70%] -translate-y-1/2 opacity-[0.14]" viewBox="0 0 400 200" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="0" x2="400" y1={60 + i * 18} y2={60 + i * 18} stroke="white" strokeWidth="2" />
            ))}
            {[
                [70, 114],
                [130, 96],
                [190, 78],
                [250, 105],
                [310, 69],
                [370, 87],
            ].map(([x, y]) => (
                <g key={x} fill="white">
                    <ellipse cx={x} cy={y} rx="11" ry="8" transform={`rotate(-22 ${x} ${y})`} />
                    <rect x={x + 9} y={y - 58} width="3" height="58" />
                </g>
            ))}
        </svg>
    );
}

const figureTones = {
    primary: { bg: 'bg-primary/10', text: 'text-primary' },
    brass: { bg: 'bg-brass/15', text: 'text-brass-ink' },
    teal: { bg: 'bg-teal/10', text: 'text-teal' },
} as const;

function Figure({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: keyof typeof figureTones }) {
    const c = figureTones[tone];

    return (
        <div className={`rounded-2xl p-3 sm:p-4 ${c.bg}`}>
            <dt className={`flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${c.text}`}>
                <span className="hidden shrink-0 sm:inline">{icon}</span>
                <span className="leading-tight">{label}</span>
            </dt>
            <dd className="tabular mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{value}</dd>
        </div>
    );
}

function RecentRow({ session }: { session: RecentSession }) {
    const { t, locale } = useTrans();
    const when = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(session.start_time));

    return (
        <li className="flex items-center gap-3 py-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: instrumentColor(session.instrument?.id) }} aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{session.song?.title}</p>
                <p className="text-sm text-muted-foreground">
                    {session.instrument?.name}, {when}
                    {session.achieved_bpm ? `, ♩ = ${session.achieved_bpm}` : ''}
                </p>
            </div>
            <p className="tabular shrink-0 font-semibold">{formatMinutes(session.duration_minutes ?? 0, t)}</p>
        </li>
    );
}
