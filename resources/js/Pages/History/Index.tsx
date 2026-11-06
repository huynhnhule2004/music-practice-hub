import { Deferred, Head, InfiniteScroll, router, useForm } from '@inertiajs/react';
import { CalendarDays, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import SessionForm, { SessionFormData } from '@/Components/SessionForm';
import YearHeatmap from '@/Components/YearHeatmap';
import Button, { IconButton, LinkButton } from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import PageHeader from '@/Components/ui/PageHeader';
import Sheet from '@/Components/ui/Sheet';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { intlLocale, useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { Instrument, PageProps, Paginated } from '@/types';

type Row = {
    id: number;
    song_id: number;
    instrument_id: number;
    start_time: string;
    local_date: string;
    duration_minutes: number;
    achieved_bpm: number | null;
    rating: number | null;
    notes: string | null;
    song: { id: number; title: string; artist: string | null } | null;
    instrument: { id: number; name: string } | null;
};

type Song = { id: number; title: string; artist: string | null; instrument_id: number };

type Props = PageProps<{
    sessions: Paginated<Row>;
    filters: { song?: string; instrument?: string; from?: string; to?: string };
    heatmap?: Record<string, number>;
    dailyGoal: number;
    today: string;
    songs: Song[];
    pickerSongs: Song[];
    instruments: Instrument[];
}>;

export default function Index({ sessions, filters, heatmap, dailyGoal, today, songs, pickerSongs, instruments }: Props) {
    const { t, locale } = useTrans();
    const [editing, setEditing] = useState<Row | null>(null);
    const dayFmt = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', day: 'numeric', month: 'long' });
    const timeFmt = new Intl.DateTimeFormat(intlLocale(locale), { hour: '2-digit', minute: '2-digit' });

    const groups = useMemo(() => {
        const map = new Map<string, Row[]>();
        for (const row of sessions.data) (map.get(row.local_date) ?? map.set(row.local_date, []).get(row.local_date)!).push(row);
        return [...map.entries()];
    }, [sessions.data]);

    const hasFilters = Object.keys(filters).length > 0;

    const applyFilter = (key: keyof Props['filters'], value: string) => {
        const next = { ...filters, [key]: value || undefined };
        router.get(route('history'), next as Record<string, string>, { preserveState: true, replace: true, reset: ['sessions'] });
    };

    const label = (date: string) => (date === today ? t('today') : dayFmt.format(new Date(`${date}T12:00:00`)));

    return (
        <AuthenticatedLayout wide>
            <Head title={t('history_title')} />
            <PageHeader
                title={t('history_title')}
                description={t('history_intro')}
                actions={
                    <LinkButton href={route('practice.create')} variant="secondary" icon={<Plus className="h-4 w-4" />}>
                        {t('log_session')}
                    </LinkButton>
                }
            />

            <section className="mb-10" aria-labelledby="year-heading">
                <h2 id="year-heading" className="mb-3 text-lg font-bold">
                    {t('year_in_practice')}
                </h2>
                <div className="rounded-xl border border-border bg-card p-4">
                    <Deferred data="heatmap" fallback={<div className="h-[130px] animate-pulse rounded-lg bg-muted" />}>
                        <YearHeatmap data={heatmap ?? {}} goal={dailyGoal} today={today} />
                    </Deferred>
                </div>
            </section>

            {/* Filters */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
                <FilterSelect label={t('filter_piece')} value={filters.song ?? ''} onChange={(v) => applyFilter('song', v)}>
                    <option value="">{t('all')}</option>
                    {songs.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.title}
                        </option>
                    ))}
                </FilterSelect>
                <FilterSelect label={t('filter_instrument')} value={filters.instrument ?? ''} onChange={(v) => applyFilter('instrument', v)}>
                    <option value="">{t('all')}</option>
                    {instruments.map((i) => (
                        <option key={i.id} value={i.id}>
                            {i.name}
                        </option>
                    ))}
                </FilterSelect>
                <DateFilter label={t('filter_from')} value={filters.from ?? ''} onChange={(v) => applyFilter('from', v)} />
                <DateFilter label={t('filter_to')} value={filters.to ?? ''} onChange={(v) => applyFilter('to', v)} />
                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<X className="h-4 w-4" />}
                        onClick={() => router.get(route('history'), {}, { reset: ['sessions'] })}
                        className="col-span-2 sm:col-span-1"
                    >
                        {t('clear_filters')}
                    </Button>
                )}
            </div>

            {sessions.data.length === 0 ? (
                <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={t('no_history_title')} body={t('no_history_body')} />
            ) : (
                <InfiniteScroll data="sessions" buffer={400} loading={<p className="py-6 text-center text-sm text-muted-foreground">{t('loading')}</p>}>
                    <div className="space-y-6">
                        {groups.map(([date, rows]) => (
                            <section key={date} aria-label={label(date)}>
                                <div className="sticky top-16 z-10 -mx-1 flex items-baseline justify-between bg-background/95 px-1 py-2 backdrop-blur">
                                    <h3 className="font-bold first-letter:uppercase">{label(date)}</h3>
                                    <span className="tabular text-sm font-semibold text-muted-foreground">
                                        {t('day_total', { minutes: rows.reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0) })}
                                    </span>
                                </div>
                                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                                    {rows.map((row) => (
                                        <li key={row.id} className="flex items-start gap-3 px-4 py-3">
                                            <span
                                                className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: instrumentColor(row.instrument?.id) }}
                                                aria-hidden="true"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">{row.song?.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {timeFmt.format(new Date(row.start_time))} · {row.instrument?.name}
                                                    {row.achieved_bpm ? ` · ♩ = ${row.achieved_bpm}` : ''}
                                                    {row.rating ? ` · ${t(`rating_${row.rating}`)}` : ''}
                                                </p>
                                                {row.notes && <p className="mt-1 line-clamp-2 text-sm">{row.notes}</p>}
                                            </div>
                                            <p className="tabular mt-0.5 shrink-0 font-semibold">
                                                {row.duration_minutes}
                                                <span className="ml-0.5 text-sm font-normal text-muted-foreground">{t('minutes_short')}</span>
                                            </p>
                                            <div className="-my-1.5 -mr-2 flex shrink-0">
                                                <IconButton label={t('edit_session')} onClick={() => setEditing(row)}>
                                                    <Pencil className="h-4 w-4" />
                                                </IconButton>
                                                <IconButton
                                                    label={t('delete_session')}
                                                    onClick={() => router.delete(route('sessions.destroy', row.id), { preserveScroll: true })}
                                                    className="hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </IconButton>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                </InfiniteScroll>
            )}

            {editing && <EditSheet row={editing} songs={pickerSongs} instruments={instruments} onClose={() => setEditing(null)} />}
        </AuthenticatedLayout>
    );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
    return (
        <label className="block min-w-0 sm:w-48">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block h-10 w-full rounded-lg border border-input bg-card px-3 pr-8 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
            >
                {children}
            </select>
        </label>
    );
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="block min-w-0 sm:w-40">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
            />
        </label>
    );
}

function EditSheet({ row, songs, instruments, onClose }: { row: Row; songs: Song[]; instruments: Instrument[]; onClose: () => void }) {
    const { t } = useTrans();
    const form = useForm<SessionFormData>({
        song_id: row.song_id,
        instrument_id: row.instrument_id,
        start_time: row.start_time,
        duration_minutes: row.duration_minutes,
        achieved_bpm: row.achieved_bpm ?? '',
        rating: row.rating,
        notes: row.notes ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(route('sessions.update', row.id), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <Sheet
            open
            onClose={onClose}
            title={t('edit_session')}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="edit-session" disabled={form.processing}>
                        {t('save_changes')}
                    </Button>
                </>
            }
        >
            <form id="edit-session" onSubmit={submit}>
                <SessionForm form={form} songs={songs} instruments={instruments} />
            </form>
        </Sheet>
    );
}
