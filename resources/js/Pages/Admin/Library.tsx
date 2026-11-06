import { Head, router, useForm } from '@inertiajs/react';
import { Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import Pagination from '@/Components/Pagination';
import SongFields, { emptySong, SongFormData } from '@/Components/SongFields';
import Button, { IconButton } from '@/Components/ui/Button';
import { Field, Input } from '@/Components/ui/Field';
import PageHeader from '@/Components/ui/PageHeader';
import Sheet from '@/Components/ui/Sheet';
import AdminLayout from '@/Layouts/AdminLayout';
import { intlLocale, useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { Instrument, PageProps, Paginated } from '@/types';

type Status = 'approved' | 'pending' | 'rejected' | 'private';

type Song = {
    id: number;
    title: string;
    artist: string | null;
    genre: string | null;
    difficulty: SongFormData['difficulty'];
    default_target_bpm: number | null;
    instrument_id: number;
    instrument: { id: number; name: string } | null;
    owner: { id: number; name: string; email: string } | null;
    rejection_reason: string | null;
    repertoire_entries_count: number;
    practice_sessions_count: number;
    updated_at: string;
};

type Props = PageProps<{
    songs: Paginated<Song>;
    filters: { status: Status; q?: string; instrument?: string };
    counts: Record<Status, number>;
    instruments: Instrument[];
}>;

export default function Library({ songs, filters, counts, instruments }: Props) {
    const { t, locale } = useTrans();
    const [query, setQuery] = useState(filters.q ?? '');
    const [editing, setEditing] = useState<Song | 'new' | null>(null);
    const [rejecting, setRejecting] = useState<Song | null>(null);
    const first = useRef(true);
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' });

    const visit = (next: Partial<Props['filters']>) =>
        router.get(route('admin.library.index'), { ...filters, ...next } as Record<string, string>, { preserveState: true, replace: true });

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const id = window.setTimeout(() => visit({ q: query || undefined }), 300);
        return () => window.clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const statuses: Status[] = ['approved', 'pending', 'rejected', 'private'];

    return (
        <AdminLayout>
            <Head title={t('admin.library')} />
            <PageHeader
                title={t('admin.library')}
                actions={
                    <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
                        {t('admin.add_song')}
                    </Button>
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
                    {statuses.map((s) => (
                        <button
                            key={s}
                            role="tab"
                            type="button"
                            aria-selected={filters.status === s}
                            onClick={() => visit({ status: s })}
                            className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-semibold ${
                                filters.status === s ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {t(`admin.status_${s}`)}
                            <span className={`tabular rounded-full px-1.5 text-xs ${s === 'pending' && counts.pending ? 'bg-coral text-white' : 'bg-background/70'}`}>
                                {counts[s]}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('search_library')}
                        className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                    />
                </div>
                <select
                    value={filters.instrument ?? ''}
                    onChange={(e) => visit({ instrument: e.target.value || undefined })}
                    aria-label={t('instrument')}
                    className="h-11 rounded-lg border border-input bg-card px-3 pr-8 text-sm"
                >
                    <option value="">{t('all')}</option>
                    {instruments.map((i) => (
                        <option key={i.id} value={i.id}>
                            {i.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                    <thead className="hidden border-b border-border bg-muted/50 text-left text-xs font-semibold text-muted-foreground md:table-header-group">
                        <tr>
                            <th className="px-4 py-2.5">{t('title')}</th>
                            <th className="px-4 py-2.5">{t('instrument')}</th>
                            <th className="px-4 py-2.5">{t('difficulty')}</th>
                            <th className="px-4 py-2.5 text-right">♩</th>
                            <th className="px-4 py-2.5">{filters.status === 'approved' ? t('admin.players_count') : t('admin.submitted_by', { name: '' }).trim()}</th>
                            <th className="px-4 py-2.5" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {songs.data.map((song) => (
                            <tr key={song.id} className="flex flex-wrap items-center gap-x-3 px-4 py-3 md:table-row md:p-0">
                                <td className="min-w-0 flex-1 md:px-4 md:py-3">
                                    <p className="font-semibold">{song.title}</p>
                                    <p className="text-muted-foreground">{song.artist}</p>
                                    {song.rejection_reason && <p className="mt-0.5 text-xs text-coral">{song.rejection_reason}</p>}
                                </td>
                                <td className="md:px-4 md:py-3">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: instrumentColor(song.instrument?.id) }} />
                                        {song.instrument?.name}
                                    </span>
                                </td>
                                <td className="hidden md:table-cell md:px-4 md:py-3">{t(`difficulty_${song.difficulty}`)}</td>
                                <td className="tabular hidden text-right md:table-cell md:px-4 md:py-3">{song.default_target_bpm ?? '–'}</td>
                                <td className="w-full text-muted-foreground md:w-auto md:px-4 md:py-3">
                                    {filters.status === 'approved' ? (
                                        <>
                                            {t('admin.used_by', { count: song.repertoire_entries_count })} · {t('admin.sessions_count', { count: song.practice_sessions_count })}
                                        </>
                                    ) : (
                                        <>
                                            {song.owner?.name} · {fmt.format(new Date(song.updated_at))}
                                        </>
                                    )}
                                </td>
                                <td className="ml-auto md:px-2 md:py-3">
                                    <div className="flex justify-end gap-1">
                                        {filters.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    icon={<Check className="h-4 w-4" />}
                                                    onClick={() => router.post(route('admin.library.approve', song.id), {}, { preserveScroll: true })}
                                                >
                                                    {t('admin.approve')}
                                                </Button>
                                                <Button size="sm" variant="secondary" icon={<X className="h-4 w-4" />} onClick={() => setRejecting(song)}>
                                                    {t('admin.reject')}
                                                </Button>
                                            </>
                                        )}
                                        <IconButton label={t('admin.edit_song')} onClick={() => setEditing(song)}>
                                            <Pencil className="h-4 w-4" />
                                        </IconButton>
                                        <IconButton
                                            label={t('delete')}
                                            className="hover:text-destructive"
                                            onClick={() => confirm(t('admin.delete_song_confirm')) && router.delete(route('admin.library.destroy', song.id), { preserveScroll: true })}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </IconButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {songs.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                    {filters.status === 'pending' ? t('admin.queue_empty') : t('no_history_title')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination page={songs} />

            {editing && <SongSheet song={editing === 'new' ? null : editing} instruments={instruments} onClose={() => setEditing(null)} />}
            {rejecting && <RejectSheet song={rejecting} onClose={() => setRejecting(null)} />}
        </AdminLayout>
    );
}

function SongSheet({ song, instruments, onClose }: { song: Song | null; instruments: Instrument[]; onClose: () => void }) {
    const { t } = useTrans();
    const form = useForm<SongFormData>(
        song
            ? {
                  title: song.title,
                  artist: song.artist ?? '',
                  genre: song.genre ?? '',
                  instrument_id: song.instrument_id,
                  difficulty: song.difficulty,
                  default_target_bpm: song.default_target_bpm ?? '',
              }
            : { ...emptySong },
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };
        song ? form.put(route('admin.library.update', song.id), opts) : form.post(route('admin.library.store'), opts);
    };

    return (
        <Sheet
            open
            onClose={onClose}
            title={song ? t('admin.edit_song') : t('admin.add_song')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="admin-song" disabled={form.processing}>
                        {t('save')}
                    </Button>
                </>
            }
        >
            <form id="admin-song" onSubmit={submit}>
                <SongFields form={form} instruments={instruments} />
            </form>
        </Sheet>
    );
}

function RejectSheet({ song, onClose }: { song: Song; onClose: () => void }) {
    const { t } = useTrans();
    const form = useForm({ reason: '' });

    return (
        <Sheet
            open
            onClose={onClose}
            title={`${t('admin.reject')}: ${song.title}`}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="danger"
                        disabled={form.processing || !form.data.reason.trim()}
                        onClick={() => form.post(route('admin.library.reject', song.id), { preserveScroll: true, onSuccess: onClose })}
                    >
                        {t('admin.reject')}
                    </Button>
                </>
            }
        >
            <Field label={t('admin.reject_reason')} error={form.errors.reason}>
                {(id) => <Input id={id} autoFocus value={form.data.reason} placeholder={t('admin.reject_reason_placeholder')} onChange={(e) => form.setData('reason', e.target.value)} />}
            </Field>
        </Sheet>
    );
}
