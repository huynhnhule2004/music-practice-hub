import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, Gauge, MoreHorizontal, Pencil, Play, Plus, Send, Target, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import GoalCard from '@/Components/GoalCard';
import GoalForm from '@/Components/GoalForm';
import SongFields, { SongFormData } from '@/Components/SongFields';
import TempoChart from '@/Components/TempoChart';
import Badge from '@/Components/ui/Badge';
import Button, { buttonClass } from '@/Components/ui/Button';
import ConfirmButton from '@/Components/ui/ConfirmButton';
import Dropdown from '@/Components/Dropdown';
import PageHeader from '@/Components/ui/PageHeader';
import Sheet from '@/Components/ui/Sheet';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMinutes, intlLocale, useTrans } from '@/lib/i18n';
import { Goal, Instrument, PageProps, RepertoireEntry } from '@/types';

type Props = PageProps<{
    entry: RepertoireEntry;
    song: {
        id: number;
        title: string;
        artist: string | null;
        genre: string | null;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        default_target_bpm: number | null;
        library_status: 'private' | 'pending' | 'approved' | 'rejected';
        rejection_reason: string | null;
        is_own: boolean;
        can_edit: boolean;
        can_submit: boolean;
    };
    tempoHistory: { date: string; bpm: number }[];
    sessions: { id: number; start_time: string; duration_minutes: number; achieved_bpm: number | null; rating: number | null; notes: string | null }[];
    activeGoal: Goal | null;
    completedGoals: Goal[];
    instruments: Instrument[];
}>;

export default function Show({ entry, song, tempoHistory, sessions, activeGoal, completedGoals, instruments }: Props) {
    const { t, locale } = useTrans();
    const [goalOpen, setGoalOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', day: 'numeric', month: 'short' });

    const setStatus = (status: RepertoireEntry['status']) => router.patch(route('repertoire.update', entry.id), { status }, { preserveScroll: true });

    return (
        <AuthenticatedLayout>
            <Head title={song.title} />
            <PageHeader
                back={{ href: route('repertoire.index'), label: t('pieces_title') }}
                title={song.title}
                description={[song.artist, entry.instrument?.name, t(`difficulty_${song.difficulty}`)].filter(Boolean).join(' · ')}
                actions={
                    <>
                        <Link href={route('practice.session', { song: song.id })} className={buttonClass('primary', 'md')}>
                            <Play className="h-4 w-4 fill-current" />
                            {t('practise_this')}
                        </Link>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button type="button" aria-label={t('menu')} className={buttonClass('secondary', 'md', 'w-11 px-0')}>
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content width="48">
                                <Dropdown.Link href={route('practice.create', { song: song.id })}>{t('log_session')}</Dropdown.Link>
                                {song.can_edit && (
                                    <button type="button" onClick={() => setEditOpen(true)} className="block w-full px-4 py-2 text-start text-sm hover:bg-muted">
                                        {t('edit_piece')}
                                    </button>
                                )}
                                <Dropdown.Link
                                    href={route('repertoire.destroy', entry.id)}
                                    method="delete"
                                    as="button"
                                    onBefore={() => confirm(t('remove_piece_confirm'))}
                                    className="!text-destructive"
                                >
                                    {t('remove_piece')}
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </>
                }
            />

            {/* Library state for members' own pieces */}
            {song.is_own && (
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    {song.library_status === 'private' && <Badge>{t('private_piece')}</Badge>}
                    {song.library_status === 'pending' && <Badge tone="amber">{t('pending_review')}</Badge>}
                    {song.library_status === 'rejected' && <Badge tone="coral">{t('rejected_piece', { reason: song.rejection_reason ?? '' })}</Badge>}
                    {song.can_submit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<Send className="h-4 w-4" />}
                            onClick={() => router.post(route('songs.submit', song.id), {}, { preserveScroll: true })}
                        >
                            {t('suggest_for_library')}
                        </Button>
                    )}
                </div>
            )}

            {/* Status: where this piece sits */}
            <div role="radiogroup" aria-label={t('mark_as')} className="mb-8 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                {(['learning', 'polishing', 'mastered'] as const).map((status) => (
                    <button
                        key={status}
                        type="button"
                        role="radio"
                        aria-checked={entry.status === status}
                        onClick={() => entry.status !== status && setStatus(status)}
                        className={`flex h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors ${
                            entry.status === status ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {status === 'mastered' && entry.status === status && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        {t(`status_${status}`)}
                    </button>
                ))}
            </div>

            {/* Key figures */}
            <dl className="mb-8 grid grid-cols-3 gap-4 border-y border-border py-5">
                <Figure icon={<Gauge className="h-4 w-4" />} label={t('best_tempo')} value={entry.best_bpm ? `♩${entry.best_bpm}` : '–'} />
                <Figure icon={<Target className="h-4 w-4" />} label={t('target_tempo')} value={entry.target_bpm ? `♩${entry.target_bpm}` : '–'} />
                <Figure icon={<Clock className="h-4 w-4" />} label={t('time_spent')} value={formatMinutes(entry.total_minutes, t)} />
            </dl>

            {!entry.target_bpm && entry.status !== 'mastered' && <ManualProgress entry={entry} />}

            <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
                <div className="space-y-10">
                    <section aria-labelledby="tempo-heading">
                        <h2 id="tempo-heading" className="mb-3 text-lg font-bold">
                            {t('tempo_over_time')}
                        </h2>
                        {tempoHistory.length > 0 ? (
                            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                                <TempoChart points={tempoHistory} target={entry.target_bpm} />
                            </div>
                        ) : (
                            <p className="rounded-xl border border-dashed border-input px-4 py-8 text-center text-sm text-muted-foreground">{t('tempo_empty')}</p>
                        )}
                    </section>

                    <section aria-labelledby="journal-heading">
                        <h2 id="journal-heading" className="mb-1 text-lg font-bold">
                            {t('journal')}
                        </h2>
                        {sessions.length === 0 ? (
                            <p className="py-6 text-sm text-muted-foreground">{t('journal_empty')}</p>
                        ) : (
                            <ol className="relative ml-1.5 border-l-2 border-border">
                                {sessions.slice(0, showAll ? undefined : 6).map((s) => (
                                    <li key={s.id} className="relative py-3 pl-6">
                                        <span className="absolute -left-[7px] top-[1.05rem] h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                                        <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
                                            <span className="font-semibold">{fmt.format(new Date(s.start_time))}</span>
                                            <span className="text-muted-foreground">
                                                {s.duration_minutes} {t('minutes_short')}
                                                {s.achieved_bpm ? ` · ♩ = ${s.achieved_bpm}` : ''}
                                                {s.rating ? ` · ${t(`rating_${s.rating}`)}` : ''}
                                            </span>
                                        </p>
                                        {s.notes && <p className="mt-1 max-w-prose whitespace-pre-line">{s.notes}</p>}
                                    </li>
                                ))}
                            </ol>
                        )}
                        {sessions.length > 6 && (
                            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAll((v) => !v)}>
                                {showAll ? t('close') : `${t('load_more')} (${sessions.length - 6})`}
                            </Button>
                        )}
                    </section>
                </div>

                <aside className="space-y-4" aria-labelledby="goal-heading">
                    <div className="flex items-baseline justify-between">
                        <h2 id="goal-heading" className="text-lg font-bold">
                            {t('goals_title')}
                        </h2>
                    </div>
                    {activeGoal ? (
                        <>
                            <GoalCard goal={activeGoal} compact />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => router.patch(route('goals.update', activeGoal.id), { is_completed: true }, { preserveScroll: true })}
                                >
                                    {t('mark_done')}
                                </Button>
                                <ConfirmButton
                                    title={t('delete')}
                                    confirmLabel={t('delete')}
                                    onConfirm={() => router.delete(route('goals.destroy', activeGoal.id), { preserveScroll: true })}
                                    trigger={(open) => (
                                        <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={open}>
                                            {t('delete')}
                                        </Button>
                                    )}
                                />
                            </div>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setGoalOpen(true)}
                            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-input p-4 text-left hover:border-primary/50 hover:bg-primary/5"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/20 text-brass-ink">
                                <Plus className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block font-semibold">{t('new_goal')}</span>
                                <span className="block text-sm text-muted-foreground">{t('no_goals_body')}</span>
                            </span>
                        </button>
                    )}

                    {completedGoals.length > 0 && (
                        <div className="pt-2">
                            <p className="mb-2 text-sm font-semibold text-muted-foreground">{t('completed_goals')}</p>
                            <ul className="space-y-1.5 text-sm">
                                {completedGoals.map((g) => (
                                    <li key={g.id} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        <span className="font-semibold">♩{g.target_bpm}</span>
                                        <span className="truncate text-muted-foreground">{g.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </div>

            <GoalForm
                open={goalOpen}
                onClose={() => setGoalOpen(false)}
                fixedSongId={song.id}
                pieces={[{ song_id: song.id, title: song.title, best_bpm: entry.best_bpm, target_bpm: entry.target_bpm }]}
            />

            {song.can_edit && <EditSongSheet open={editOpen} onClose={() => setEditOpen(false)} song={song} instrumentId={entry.instrument?.id} instruments={instruments} />}
        </AuthenticatedLayout>
    );
}

function Figure({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div>
            <dt className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                {icon}
                {label}
            </dt>
            <dd className="tabular mt-1 text-2xl font-bold tracking-tight">{value}</dd>
        </div>
    );
}

function ManualProgress({ entry }: { entry: RepertoireEntry }) {
    const { t } = useTrans();
    const [value, setValue] = useState(entry.progress);

    return (
        <div className="mb-8 rounded-xl border border-border bg-card p-4">
            <label htmlFor="manual-progress" className="flex items-center justify-between text-sm font-medium">
                {t('manual_progress')}
                <span className="tabular font-bold">{value}%</span>
            </label>
            <input
                id="manual-progress"
                type="range"
                min={0}
                max={100}
                step={5}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                onPointerUp={() => router.patch(route('repertoire.update', entry.id), { progress_percentage: value }, { preserveScroll: true })}
                onKeyUp={() => router.patch(route('repertoire.update', entry.id), { progress_percentage: value }, { preserveScroll: true })}
                className="mt-3 w-full accent-[hsl(var(--primary))]"
            />
        </div>
    );
}

function EditSongSheet({
    open,
    onClose,
    song,
    instrumentId,
    instruments,
}: {
    open: boolean;
    onClose: () => void;
    song: Props['song'];
    instrumentId?: number;
    instruments: Instrument[];
}) {
    const { t } = useTrans();
    const form = useForm<SongFormData>({
        title: song.title,
        artist: song.artist ?? '',
        genre: song.genre ?? '',
        instrument_id: instrumentId ?? '',
        difficulty: song.difficulty,
        default_target_bpm: song.default_target_bpm ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(route('songs.update', song.id), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={
                <span className="inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    {t('edit_piece')}
                </span>
            }
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="edit-song" disabled={form.processing}>
                        {t('save_changes')}
                    </Button>
                </>
            }
        >
            <form id="edit-song" onSubmit={submit}>
                <SongFields form={form} instruments={instruments} />
            </form>
        </Sheet>
    );
}
