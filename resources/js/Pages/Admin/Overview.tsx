import { Head, Link, router } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import Button from '@/Components/ui/Button';
import PageHeader from '@/Components/ui/PageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import { intlLocale, useTrans } from '@/lib/i18n';
import { PageProps } from '@/types';

type Props = PageProps<{
    stats: {
        users: number;
        new_users_7d: number;
        active_users_7d: number;
        sessions_30d: number;
        hours_30d: number;
        library_songs: number;
        pending_songs: number;
        suspended_users: number;
    };
    days: { date: string; sessions: number; minutes: number; users: number }[];
    recentUsers: { id: number; name: string; email: string; created_at: string }[];
    pending: { id: number; title: string; artist: string | null; owner: { id: number; name: string } | null; instrument: { name: string } | null; updated_at: string }[];
}>;

export default function Overview({ stats, days, recentUsers, pending }: Props) {
    const { t, locale } = useTrans();
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' });
    const max = Math.max(...days.map((d) => d.minutes), 1);

    const tiles = [
        { label: t('admin.stat_users'), value: stats.users, sub: `+${stats.new_users_7d} ${t('admin.stat_new_users').toLowerCase()}` },
        { label: t('admin.stat_active_users'), value: stats.active_users_7d },
        { label: t('admin.stat_sessions'), value: stats.sessions_30d },
        { label: t('admin.stat_hours'), value: stats.hours_30d.toLocaleString(intlLocale(locale)) },
        { label: t('admin.stat_library'), value: stats.library_songs },
        { label: t('admin.stat_pending'), value: stats.pending_songs, tone: stats.pending_songs ? 'text-coral' : '' },
    ];

    return (
        <AdminLayout>
            <Head title={t('admin.overview')} />
            <PageHeader title={t('admin.overview')} />

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
                {tiles.map((tile) => (
                    <div key={tile.label} className="bg-card p-4">
                        <dt className="text-xs font-semibold text-muted-foreground">{tile.label}</dt>
                        <dd className={`tabular mt-1 text-2xl font-bold tracking-tight ${tile.tone ?? ''}`}>{tile.value}</dd>
                        {tile.sub && <dd className="mt-0.5 text-xs text-muted-foreground">{tile.sub}</dd>}
                    </div>
                ))}
            </dl>

            <section className="mt-8" aria-labelledby="activity-heading">
                <h2 id="activity-heading" className="mb-3 font-bold">
                    {t('admin.activity_30d')}
                </h2>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex h-40 items-end gap-[3px]" role="img" aria-label={t('admin.activity_30d')}>
                        {days.map((d) => (
                            <div
                                key={d.date}
                                className="flex-1 rounded-t bg-primary/80 hover:bg-primary"
                                style={{ height: `${Math.max((d.minutes / max) * 100, d.minutes ? 3 : 1)}%` }}
                                title={`${fmt.format(new Date(d.date))}: ${d.sessions} · ${d.minutes} min · ${d.users} users`}
                            />
                        ))}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>{fmt.format(new Date(days[0].date))}</span>
                        <span>{fmt.format(new Date(days[days.length - 1].date))}</span>
                    </div>
                </div>
            </section>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <section aria-labelledby="queue-heading">
                    <div className="mb-3 flex items-baseline justify-between">
                        <h2 id="queue-heading" className="font-bold">
                            {t('admin.review_queue')}
                        </h2>
                        {stats.pending_songs > 0 && (
                            <Link href={route('admin.library.index', { status: 'pending' })} className="text-sm font-semibold text-primary hover:underline">
                                {t('admin.review_all')}
                            </Link>
                        )}
                    </div>
                    {pending.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-input px-4 py-8 text-center text-sm text-muted-foreground">{t('admin.queue_empty')}</p>
                    ) : (
                        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                            {pending.map((song) => (
                                <li key={song.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{song.title}</p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {[song.artist, song.instrument?.name].filter(Boolean).join(' · ')} — {t('admin.submitted_by', { name: song.owner?.name ?? '?' })}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={<Check className="h-4 w-4" />}
                                        onClick={() => router.post(route('admin.library.approve', song.id), {}, { preserveScroll: true })}
                                    >
                                        {t('admin.approve')}
                                    </Button>
                                    <Link
                                        href={route('admin.library.index', { status: 'pending' })}
                                        aria-label={t('admin.reject')}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section aria-labelledby="members-heading">
                    <div className="mb-3 flex items-baseline justify-between">
                        <h2 id="members-heading" className="font-bold">
                            {t('admin.newest_members')}
                        </h2>
                        <Link href={route('admin.users.index')} className="text-sm font-semibold text-primary hover:underline">
                            {t('see_all')}
                        </Link>
                    </div>
                    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                        {recentUsers.map((u) => (
                            <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {u.name
                                        .split(/\s+/)
                                        .slice(-2)
                                        .map((p) => p[0])
                                        .join('')
                                        .toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold">{u.name}</p>
                                    <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">{fmt.format(new Date(u.created_at))}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </AdminLayout>
    );
}
