import { Head, Link } from '@inertiajs/react';
import { Flame, Play, Plus } from 'lucide-react';
import GoalCard from '@/Components/GoalCard';
import PieceCard from '@/Components/PieceCard';
import PracticeStaff from '@/Components/PracticeStaff';
import StaffScroller from '@/Components/StaffScroller';
import { buttonClass, LinkButton } from '@/Components/ui/Button';
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

            {/* Today: greeting, the ring, one big action */}
            <section className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
                <div>
                    <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl">{t(greeting, { name: firstName })}</h1>
                    <p className="mt-1.5 text-muted-foreground">{nudge}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link href={route('practice.session')} className={buttonClass('primary', 'lg', 'shadow-md shadow-primary/20')}>
                            <Play className="h-5 w-5 fill-current" />
                            {todayMinutes > 0 ? t('keep_going') : t('start_practising')}
                        </Link>
                        <Link href={route('practice.create')} className={buttonClass('ghost', 'lg')}>
                            {t('log_session')}
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-8">
                    <GoalRing minutes={todayMinutes} goal={dailyGoal} />
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('current_streak')}</p>
                            <p className="tabular mt-0.5 inline-flex items-center gap-1 text-3xl font-bold text-coral">
                                <Flame className="h-7 w-7" aria-hidden="true" />
                                {streak.current}
                            </p>
                            <p className="text-xs text-muted-foreground">{t('best_streak', { days: streak.best })}</p>
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

                <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-border py-5">
                    <Figure label={t('total_sessions')} value={totals.sessions} />
                    <Figure label={t('hours_practiced')} value={(totals.minutes / 60).toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 })} />
                    <Figure label={t('songs_learned')} value={totals.pieces} />
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

/** Today's minutes as a ring that fills toward the daily goal. */
function GoalRing({ minutes, goal }: { minutes: number; goal: number }) {
    const { t } = useTrans();
    const r = 52;
    const c = 2 * Math.PI * r;
    const pct = Math.min(minutes / goal, 1);
    const met = minutes >= goal;

    return (
        <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`${minutes} / ${goal} ${t('minutes_short')}`}>
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
                <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - pct)}
                    className={`transition-[stroke-dashoffset] duration-700 ${met ? 'stroke-primary' : 'stroke-brass'}`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular text-3xl font-bold leading-none tracking-tight">{minutes}</span>
                <span className="mt-1 text-xs font-medium text-muted-foreground">{t('of_goal', { goal })}</span>
            </div>
        </div>
    );
}

function Figure({ label, value }: { label: string; value: number | string }) {
    return (
        <div>
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="tabular mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">{value}</dd>
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
