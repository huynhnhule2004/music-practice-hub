import { Deferred, Head } from '@inertiajs/react';
import { Flame } from 'lucide-react';
import PageHeader from '@/Components/ui/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMinutes, intlLocale, useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { PageProps } from '@/types';

type Insights = {
    weeks: { week_start: string; is_current: boolean; by_instrument: Record<string, number>; total: number }[];
    instruments: { id: number; name: string }[];
    topPieces: { id: number; title: string; artist: string | null; minutes: number; sessions: number }[];
    byHour: number[];
    byWeekday: number[];
    summary: { minutes: number; active_days: number; avg_session: number; avg_rating: number | null };
};

export default function Index({ streak, insights }: PageProps<{ streak: { current: number; best: number }; insights?: Insights }>) {
    const { t } = useTrans();

    return (
        <AuthenticatedLayout wide>
            <Head title={t('insights_title')} />
            <PageHeader title={t('insights_title')} description={t('insights_intro')} />

            <Deferred data="insights" fallback={<Skeleton />}>
                {insights && (insights.summary.minutes === 0 ? <p className="rounded-xl border border-dashed border-input px-6 py-12 text-center text-muted-foreground">{t('insights_empty')}</p> : <Body insights={insights} streak={streak} />)}
            </Deferred>
        </AuthenticatedLayout>
    );
}

function Body({ insights, streak }: { insights: Insights; streak: { current: number; best: number } }) {
    const { t, list, locale } = useTrans();
    const { summary } = insights;

    return (
        <div className="space-y-10">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-5 sm:grid-cols-4">
                <Stat label={t('hours_practiced')} value={(summary.minutes / 60).toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 })} />
                <Stat label={t('active_days')} value={summary.active_days} />
                <Stat label={t('avg_session')} value={formatMinutes(summary.avg_session, t)} />
                <Stat
                    label={t('longest_streak')}
                    value={
                        <span className="inline-flex items-center gap-1 text-coral">
                            <Flame className="h-6 w-6" />
                            {streak.best}
                        </span>
                    }
                />
            </dl>

            <section aria-labelledby="weekly-heading">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                    <h2 id="weekly-heading" className="text-lg font-bold">
                        {t('minutes_per_week')}
                    </h2>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {insights.instruments.map((i) => (
                            <li key={i.id} className="inline-flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: instrumentColor(i.id) }} aria-hidden="true" />
                                {i.name}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <WeeklyBars insights={insights} />
                </div>
            </section>

            <div className="grid gap-10 lg:grid-cols-2">
                <section aria-labelledby="top-heading">
                    <h2 id="top-heading" className="mb-3 text-lg font-bold">
                        {t('top_pieces')}
                    </h2>
                    <ol className="space-y-3">
                        {insights.topPieces.map((p, i) => {
                            const max = insights.topPieces[0]?.minutes || 1;
                            return (
                                <li key={p.id}>
                                    <div className="flex items-baseline justify-between gap-3 text-sm">
                                        <span className="truncate font-semibold">
                                            <span className="tabular mr-2 text-muted-foreground">{i + 1}</span>
                                            {p.title}
                                        </span>
                                        <span className="tabular shrink-0 text-muted-foreground">{formatMinutes(p.minutes, t)}</span>
                                    </div>
                                    <div className="mt-1.5 h-2 rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${(p.minutes / max) * 100}%` }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </section>

                <section aria-labelledby="when-heading">
                    <h2 id="when-heading" className="mb-3 text-lg font-bold">
                        {t('time_of_day')}
                    </h2>
                    <HourStrip byHour={insights.byHour} />
                    <h3 className="mb-3 mt-8 font-bold">{t('day_of_week')}</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {insights.byWeekday.map((m, i) => {
                            const max = Math.max(...insights.byWeekday, 1);
                            return (
                                <div key={i} className="text-center">
                                    <div className="flex h-24 items-end rounded-lg bg-muted/60">
                                        <div className="w-full rounded-lg bg-primary" style={{ height: `${Math.max((m / max) * 100, m ? 6 : 0)}%` }} title={`${m} ${t('minutes_short')}`} />
                                    </div>
                                    <p className="mt-1.5 text-xs font-semibold text-muted-foreground">{list('weekday_short')[i]}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}

function WeeklyBars({ insights }: { insights: Insights }) {
    const { t, locale } = useTrans();
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' });
    const max = Math.max(...insights.weeks.map((w) => w.total), 1);
    const H = 180;

    return (
        <div className="flex h-[220px] items-end gap-1.5 sm:gap-2.5" role="img" aria-label={t('minutes_per_week')}>
            {insights.weeks.map((week) => (
                <div key={week.week_start} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                    <p className="tabular mb-1 text-center text-[11px] font-semibold text-muted-foreground">{week.total || ''}</p>
                    <div
                        className={`flex flex-col-reverse overflow-hidden rounded-md ${week.is_current ? 'ring-2 ring-brass ring-offset-2 ring-offset-card' : ''}`}
                        style={{ height: `${(week.total / max) * H}px` }}
                        title={`${fmt.format(new Date(week.week_start))}: ${week.total} ${t('minutes_short')}`}
                    >
                        {insights.instruments.map((i) => {
                            const m = week.by_instrument[i.id] ?? 0;
                            return m ? <div key={i.id} style={{ height: `${(m / week.total) * 100}%`, backgroundColor: instrumentColor(i.id) }} /> : null;
                        })}
                    </div>
                    <p className="mt-1.5 truncate text-center text-[10px] text-muted-foreground">{fmt.format(new Date(week.week_start))}</p>
                </div>
            ))}
        </div>
    );
}

function HourStrip({ byHour }: { byHour: number[] }) {
    const { t } = useTrans();
    const max = Math.max(...byHour, 1);
    const bands = [
        { label: t('morning'), from: 5, to: 12 },
        { label: t('afternoon'), from: 12, to: 17 },
        { label: t('evening'), from: 17, to: 22 },
        { label: t('night'), from: 22, to: 29 },
    ];
    const bandTotals = bands.map((b) => Array.from({ length: b.to - b.from }, (_, i) => byHour[(b.from + i) % 24]).reduce((a, c) => a + c, 0));
    const top = bandTotals.indexOf(Math.max(...bandTotals));

    return (
        <div>
            <div className="flex h-20 items-end gap-[3px]">
                {byHour.map((m, h) => (
                    <div
                        key={h}
                        className={`flex-1 rounded-t-sm ${m ? 'bg-primary' : 'bg-muted'}`}
                        style={{ height: `${Math.max((m / max) * 100, 4)}%`, opacity: m ? 0.35 + 0.65 * (m / max) : 1 }}
                        title={`${h}:00 — ${m} ${t('minutes_short')}`}
                    />
                ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
                <span>18h</span>
                <span>23h</span>
            </div>
            <p className="mt-3 text-sm">
                <span className="font-semibold text-primary">{bands[top].label}</span>
                <span className="text-muted-foreground"> · {formatMinutes(bandTotals[top], t)}</span>
            </p>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="tabular mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">{value}</dd>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-6" aria-busy="true">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
            <div className="h-[250px] animate-pulse rounded-xl bg-muted" />
        </div>
    );
}
