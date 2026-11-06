import { Head, router, useForm } from '@inertiajs/react';
import { Check, Plus, Search } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import SongFields, { emptySong, SongFormData } from '@/Components/SongFields';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import PageHeader from '@/Components/ui/PageHeader';
import Sheet from '@/Components/ui/Sheet';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { Instrument, PageProps } from '@/types';

type LibrarySong = {
    id: number;
    title: string;
    artist: string | null;
    genre: string | null;
    difficulty: string;
    default_target_bpm: number | null;
    instrument: { id: number; name: string } | null;
    is_private: boolean;
    in_repertoire: boolean;
};

export default function Add({ library, search, instruments }: PageProps<{ library: LibrarySong[]; search: string; instruments: Instrument[] }>) {
    const { t } = useTrans();
    const [query, setQuery] = useState(search);
    const [creating, setCreating] = useState(false);
    const [adding, setAdding] = useState<number | null>(null);
    const first = useRef(true);

    // Search as you type, debounced; keep the input focused across reloads.
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const id = window.setTimeout(() => {
            router.get(route('repertoire.create'), query ? { q: query } : {}, { preserveState: true, preserveScroll: true, replace: true, only: ['library', 'search'] });
        }, 250);
        return () => window.clearTimeout(id);
    }, [query]);

    const add = (song: LibrarySong) => {
        setAdding(song.id);
        router.post(route('repertoire.store'), { song_id: song.id }, { onFinish: () => setAdding(null) });
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('add_piece_title')} />
            <PageHeader title={t('add_piece_title')} back={{ href: route('repertoire.index'), label: t('pieces_title') }} />

            <div className="relative mb-5 max-w-2xl">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('search_library')}
                    aria-label={t('search_library')}
                    className="block h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-base placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                />
            </div>

            <ul className="max-w-2xl divide-y divide-border rounded-xl border border-border bg-card">
                {library.map((song) => (
                    <li key={song.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: instrumentColor(song.instrument?.id) }} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">
                                {song.title}
                                {song.is_private && (
                                    <Badge className="ml-2 align-middle" tone="neutral">
                                        {t('private_piece')}
                                    </Badge>
                                )}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                                {[song.artist, song.instrument?.name, t(`difficulty_${song.difficulty}`)].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                        {song.in_repertoire ? (
                            <span className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-semibold text-primary">
                                <Check className="h-4 w-4" />
                                {t('in_your_pieces')}
                            </span>
                        ) : (
                            <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} disabled={adding === song.id} onClick={() => add(song)}>
                                {t('add')}
                            </Button>
                        )}
                    </li>
                ))}
                {library.length === 0 && <li className="px-4 py-8 text-center text-muted-foreground">{t('no_history_title')}</li>}
            </ul>

            <div className="mt-6 max-w-2xl rounded-xl bg-muted/60 p-5">
                <p className="font-semibold">{t('not_in_library')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('create_own_intro')}</p>
                <Button className="mt-4" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
                    {t('create_own')}
                </Button>
            </div>

            <CreateSongSheet open={creating} onClose={() => setCreating(false)} instruments={instruments} initialTitle={query} />
        </AuthenticatedLayout>
    );
}

function CreateSongSheet({ open, onClose, instruments, initialTitle }: { open: boolean; onClose: () => void; instruments: Instrument[]; initialTitle: string }) {
    const { t } = useTrans();
    const form = useForm<SongFormData>({ ...emptySong });

    useEffect(() => {
        if (open && !form.data.title) form.setData('title', initialTitle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('repertoire.store-custom'), { onSuccess: onClose });
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={t('create_own')}
            description={t('create_own_intro')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="create-song" disabled={form.processing}>
                        {form.processing ? t('saving') : t('add_piece')}
                    </Button>
                </>
            }
        >
            <form id="create-song" onSubmit={submit}>
                <SongFields form={form} instruments={instruments} />
            </form>
        </Sheet>
    );
}
