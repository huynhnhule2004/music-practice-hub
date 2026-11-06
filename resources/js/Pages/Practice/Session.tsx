import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronDown, Minus, Pause, Play, Plus, Square, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Button, { IconButton } from '@/Components/ui/Button';
import { ChoiceChips, Field, Select, Textarea } from '@/Components/ui/Field';
import Sheet from '@/Components/ui/Sheet';
import { useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { createTapTempo, Metronome } from '@/lib/metronome';
import { useWakeLock } from '@/lib/useWakeLock';
import { Instrument, PageProps, RepertoireEntry } from '@/types';

type Song = { id: number; title: string; artist: string | null; instrument_id: number; default_target_bpm: number | null; in_repertoire: boolean };

type Props = PageProps<{
    songs: Song[];
    instruments: Instrument[];
    selectedSongId: number | null;
    suggestions: RepertoireEntry[];
    targetBpm: number | null;
    now: string;
}>;

type Saved = {
    songId: number | null;
    instrumentId: number | null;
    startedAt: string | null; // local wall-clock "YYYY-MM-DDTHH:mm" for the server
    accumulatedMs: number;
    runningSince: number | null; // epoch ms while the timer runs
    bpm: number;
    beatsPerBar: number;
    note: string;
};

const STORAGE_KEY = 'musichub-practice-session';

function loadSaved(): Saved | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
        return null;
    }
}

function localStamp(date = new Date()) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Session({ songs, instruments, selectedSongId, suggestions, targetBpm }: Props) {
    const { t } = useTrans();
    const songsById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);

    // Restore an in-progress session (refresh, accidental close) unless a different piece was asked for.
    const restored = useRef<Saved | null>(null);
    const [state, setState] = useState<Saved>(() => {
        const saved = loadSaved();
        if (saved && (saved.accumulatedMs > 0 || saved.runningSince) && (!selectedSongId || saved.songId === selectedSongId)) {
            restored.current = saved;
            return saved;
        }
        const song = selectedSongId ? songsById.get(selectedSongId) : undefined;
        return {
            songId: song?.id ?? null,
            instrumentId: song?.instrument_id ?? null,
            startedAt: null,
            accumulatedMs: 0,
            runningSince: null,
            bpm: Math.round((targetBpm ?? song?.default_target_bpm ?? 80) * 0.8),
            beatsPerBar: 4,
            note: '',
        };
    });

    const [now, setNow] = useState(Date.now());
    const [picking, setPicking] = useState(!state.songId);
    const [finishing, setFinishing] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const [metronomeOn, setMetronomeOn] = useState(false);
    const [beat, setBeat] = useState<number | null>(null);
    const [muted, setMuted] = useState(false);
    const [notice, setNotice] = useState<string | null>(restored.current ? t('session_resumed') : null);

    const metronome = useRef<Metronome | null>(null);
    const tap = useRef(createTapTempo());

    const running = state.runningSince !== null;
    const elapsedMs = state.accumulatedMs + (running ? now - state.runningSince! : 0);
    const song = state.songId ? songsById.get(state.songId) : undefined;
    const target = targetBpm ?? song?.default_target_bpm ?? null;

    useWakeLock(running);

    // Persist every change so nothing is lost.
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            /* storage unavailable: session still works in memory */
        }
    }, [state]);

    useEffect(() => {
        if (!running) return;
        const id = window.setInterval(() => setNow(Date.now()), 250);
        return () => window.clearInterval(id);
    }, [running]);

    useEffect(() => {
        if (!notice) return;
        const id = window.setTimeout(() => setNotice(null), 3500);
        return () => window.clearTimeout(id);
    }, [notice]);

    // Metronome lifecycle
    useEffect(() => {
        const m = new Metronome();
        m.onBeat = (b) => setBeat(b);
        metronome.current = m;
        return () => m.dispose();
    }, []);

    useEffect(() => {
        const m = metronome.current;
        if (!m) return;
        m.bpm = state.bpm;
        m.beatsPerBar = state.beatsPerBar;
        m.muted = muted;
    }, [state.bpm, state.beatsPerBar, muted]);

    useEffect(() => {
        const m = metronome.current;
        if (!m) return;
        if (metronomeOn) m.start();
        else {
            m.stop();
            setBeat(null);
        }
    }, [metronomeOn]);

    const update = (patch: Partial<Saved>) => setState((s) => ({ ...s, ...patch }));

    const toggleTimer = () => {
        if (running) {
            update({ accumulatedMs: elapsedMs, runningSince: null });
        } else {
            setNow(Date.now());
            update({ runningSince: Date.now(), startedAt: state.startedAt ?? localStamp() });
        }
    };

    const setBpm = (bpm: number) => update({ bpm: Math.min(300, Math.max(30, Math.round(bpm))) });

    const chooseSong = (id: number) => {
        const picked = songsById.get(id);
        update({ songId: id, instrumentId: picked?.instrument_id ?? state.instrumentId });
        setPicking(false);
    };

    const reset = () => {
        setMetronomeOn(false);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            /* ignore */
        }
    };

    const minutes = Math.floor(elapsedMs / 60000);

    return (
        <>
            <Head title={t('practice_title')} />

            <div className="flex min-h-dvh flex-col bg-background">
                {/* Top: what you're playing */}
                <header className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
                    <IconButton
                        label={t('close')}
                        onClick={() => (elapsedMs > 0 ? setConfirmDiscard(true) : (reset(), router.visit(route('dashboard'))))}
                    >
                        <X className="h-6 w-6" />
                    </IconButton>
                    <button
                        type="button"
                        onClick={() => setPicking(true)}
                        className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-center hover:bg-muted"
                    >
                        {song && (
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: instrumentColor(state.instrumentId ?? undefined) }} />
                        )}
                        <span className="min-w-0">
                            <span className="block truncate font-bold">{song?.title ?? t('choose_what')}</span>
                            {song && (
                                <span className="block truncate text-xs text-muted-foreground">
                                    {instruments.find((i) => i.id === state.instrumentId)?.name}
                                    {target ? ` · ${t('target')} ♩${target}` : ''}
                                </span>
                            )}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                    <div className="w-11" />
                </header>

                {notice && (
                    <p role="status" className="toast-in mx-auto mt-3 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        {notice}
                    </p>
                )}

                <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-6">
                    {/* Timer: readable from a music stand */}
                    <p
                        className="tabular text-[clamp(4.5rem,24vw,8.5rem)] font-bold leading-none tracking-tighter"
                        aria-live="off"
                        aria-label={`${minutes} ${t('minutes_short')}`}
                    >
                        {formatClock(elapsedMs)}
                    </p>
                    <p className="mt-2 h-5 text-sm text-muted-foreground">{running ? t('keep_screen_on') : ''}</p>

                    <div className="mt-8 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={toggleTimer}
                            disabled={!song}
                            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 disabled:opacity-40"
                            aria-label={running ? t('pause') : elapsedMs > 0 ? t('resume') : t('start')}
                        >
                            {running ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 translate-x-0.5 fill-current" />}
                        </button>
                        {elapsedMs > 0 && (
                            <Button
                                variant="secondary"
                                size="lg"
                                icon={<Square className="h-4 w-4 fill-current" />}
                                onClick={() => {
                                    if (running) toggleTimer();
                                    setFinishing(true);
                                }}
                            >
                                {t('finish')}
                            </Button>
                        )}
                    </div>

                    {/* Metronome */}
                    <section aria-label={t('metronome')} className="mt-10 w-full rounded-2xl border border-border bg-card p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-bold">{t('metronome')}</h2>
                            <div className="flex items-center gap-1">
                                <IconButton label={muted ? t('sound_on') : t('sound_off')} onClick={() => setMuted((m) => !m)}>
                                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                </IconButton>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={metronomeOn}
                                    onClick={() => setMetronomeOn((on) => !on)}
                                    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${metronomeOn ? 'bg-primary' : 'bg-input'}`}
                                >
                                    <span className="sr-only">{t('metronome')}</span>
                                    <span
                                        className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${metronomeOn ? 'translate-x-6' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <IconButton label="−" className="h-12 w-12 border border-input" onClick={() => setBpm(state.bpm - (state.bpm > 60 ? 2 : 1))}>
                                <Minus className="h-5 w-5" />
                            </IconButton>
                            <div className="text-center">
                                <p className="tabular text-5xl font-bold tracking-tight">
                                    <span className="mr-1 text-3xl text-muted-foreground">♩=</span>
                                    {state.bpm}
                                </p>
                            </div>
                            <IconButton label="+" className="h-12 w-12 border border-input" onClick={() => setBpm(state.bpm + (state.bpm >= 60 ? 2 : 1))}>
                                <Plus className="h-5 w-5" />
                            </IconButton>
                        </div>

                        <input
                            type="range"
                            min={30}
                            max={240}
                            value={state.bpm}
                            onChange={(e) => setBpm(Number(e.target.value))}
                            aria-label={t('bpm')}
                            className="mt-4 w-full accent-[hsl(var(--primary))]"
                        />

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2" aria-hidden="true">
                                {Array.from({ length: state.beatsPerBar }).map((_, i) => (
                                    <span
                                        key={`${i}-${beat === i ? now : ''}`}
                                        className={`h-3.5 w-3.5 rounded-full transition-colors ${
                                            beat === i ? `beat-pulse ${i === 0 ? 'bg-brass' : 'bg-primary'}` : 'bg-muted'
                                        }`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={state.beatsPerBar}
                                    onChange={(e) => update({ beatsPerBar: Number(e.target.value) })}
                                    aria-label={t('beats_per_bar')}
                                    className="h-11 rounded-lg border border-input bg-card px-3 pr-8 text-sm font-semibold"
                                >
                                    {[2, 3, 4, 5, 6, 7].map((n) => (
                                        <option key={n} value={n}>
                                            {n}/4
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const bpm = tap.current();
                                        if (bpm) setBpm(bpm);
                                    }}
                                >
                                    {t('tap')}
                                </Button>
                            </div>
                        </div>
                    </section>

                    <textarea
                        value={state.note}
                        onChange={(e) => update({ note: e.target.value })}
                        rows={2}
                        placeholder={t('quick_note')}
                        className="mt-4 block w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-base placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 sm:text-sm"
                    />

                    <Link href={route('practice.create')} className="mt-6 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                        {t('log_manually')}
                    </Link>
                </main>
            </div>

            <PiecePicker
                open={picking}
                onClose={() => setPicking(false)}
                songs={songs}
                suggestions={suggestions}
                instruments={instruments}
                instrumentId={state.instrumentId}
                onInstrument={(id) => update({ instrumentId: id })}
                onPick={chooseSong}
                selected={state.songId}
            />

            {finishing && song && (
                <FinishSheet
                    state={state}
                    minutes={Math.max(1, Math.round(elapsedMs / 60000))}
                    tooShort={elapsedMs < 60000}
                    usedMetronome={metronomeOn || state.bpm !== 80}
                    onClose={() => setFinishing(false)}
                    onSaved={reset}
                />
            )}

            <Sheet
                open={confirmDiscard}
                onClose={() => setConfirmDiscard(false)}
                title={t('discard_confirm')}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                reset();
                                router.visit(route('dashboard'));
                            }}
                        >
                            {t('discard')}
                        </Button>
                    </>
                }
            >
                <span />
            </Sheet>
        </>
    );
}

function PiecePicker({
    open,
    onClose,
    songs,
    suggestions,
    instruments,
    instrumentId,
    onInstrument,
    onPick,
    selected,
}: {
    open: boolean;
    onClose: () => void;
    songs: Song[];
    suggestions: RepertoireEntry[];
    instruments: Instrument[];
    instrumentId: number | null;
    onInstrument: (id: number) => void;
    onPick: (id: number) => void;
    selected: number | null;
}) {
    const { t } = useTrans();
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const filtered = songs.filter((s) => !q || s.title.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q));
    const mine = filtered.filter((s) => s.in_repertoire);
    const library = filtered.filter((s) => !s.in_repertoire);

    return (
        <Sheet open={open} onClose={onClose} title={t('choose_what')} size="lg">
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search_library')}
                className="mb-4 block h-11 w-full rounded-lg border border-input bg-background px-3 text-base placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 sm:text-sm"
            />

            {!q && suggestions.length > 0 && (
                <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-muted-foreground">{t('practise_next')}</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => onPick(s.song_id)}
                                className="rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                            >
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {[
                { label: t('your_pieces'), items: mine },
                { label: t('library'), items: library },
            ].map(
                (group) =>
                    group.items.length > 0 && (
                        <div key={group.label} className="mb-4">
                            <p className="mb-1 text-sm font-semibold text-muted-foreground">{group.label}</p>
                            <ul className="divide-y divide-border">
                                {group.items.map((s) => (
                                    <li key={s.id}>
                                        <button
                                            type="button"
                                            onClick={() => onPick(s.id)}
                                            aria-pressed={selected === s.id}
                                            className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-muted ${selected === s.id ? 'bg-primary/5' : ''}`}
                                        >
                                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: instrumentColor(s.instrument_id) }} />
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold">{s.title}</span>
                                                {s.artist && <span className="block truncate text-sm text-muted-foreground">{s.artist}</span>}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ),
            )}

            {selected && (
                <div className="sticky bottom-0 -mx-1 border-t border-border bg-card px-1 pt-3">
                    <Field label={t('instrument')}>
                        {(id) => (
                            <Select id={id} value={instrumentId ?? ''} onChange={(e) => onInstrument(Number(e.target.value))}>
                                {instruments.map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.name}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                </div>
            )}
        </Sheet>
    );
}

function FinishSheet({
    state,
    minutes,
    tooShort,
    usedMetronome,
    onClose,
    onSaved,
}: {
    state: Saved;
    minutes: number;
    tooShort: boolean;
    usedMetronome: boolean;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { t } = useTrans();
    const form = useForm({
        song_id: state.songId,
        instrument_id: state.instrumentId,
        start_time: state.startedAt ?? localStamp(),
        duration_minutes: minutes,
        achieved_bpm: usedMetronome ? (state.bpm as number | '') : '',
        rating: null as number | null,
        notes: state.note,
    });

    const save = () => {
        form.post(route('practice.store'), { onSuccess: onSaved });
    };

    return (
        <Sheet
            open
            onClose={onClose}
            title={t('how_did_it_go')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('back')}
                    </Button>
                    <Button onClick={save} disabled={form.processing || tooShort}>
                        {form.processing ? t('saving') : t('save_session')}
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                {tooShort && <p className="rounded-lg bg-brass/15 px-3 py-2 text-sm font-medium text-brass-ink">{t('session_too_short')}</p>}

                <div className="flex items-baseline gap-2">
                    <p className="tabular text-4xl font-bold tracking-tight">{form.data.duration_minutes}</p>
                    <p className="text-muted-foreground">{t('minutes_short')}</p>
                </div>

                <div>
                    <p className="mb-2 text-sm font-medium">{t('rating')}</p>
                    <ChoiceChips
                        label={t('rating')}
                        value={form.data.rating}
                        onChange={(v) => form.setData('rating', v)}
                        options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: t(`rating_${n}`) }))}
                    />
                </div>

                <Field
                    label={t('tempo_reached')}
                    optional
                    hint={usedMetronome ? t('tempo_from_metronome') : undefined}
                    error={form.errors.achieved_bpm}
                >
                    {(id, describedBy) => (
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">♩ =</span>
                            <input
                                id={id}
                                aria-describedby={describedBy}
                                type="number"
                                inputMode="numeric"
                                min={20}
                                max={400}
                                value={form.data.achieved_bpm}
                                onChange={(e) => form.setData('achieved_bpm', e.target.value === '' ? '' : Number(e.target.value))}
                                className="tabular block h-11 w-full rounded-lg border border-input bg-card pl-11 pr-3 text-base focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 sm:text-sm"
                            />
                        </div>
                    )}
                </Field>

                <Field label={t('notes')} optional error={form.errors.notes}>
                    {(id) => (
                        <Textarea id={id} rows={3} value={form.data.notes} placeholder={t('notes_placeholder')} onChange={(e) => form.setData('notes', e.target.value)} />
                    )}
                </Field>

                {(form.errors.song_id || form.errors.duration_minutes) && (
                    <p className="text-sm font-medium text-destructive">{form.errors.song_id ?? form.errors.duration_minutes}</p>
                )}
            </div>
        </Sheet>
    );
}

function formatClock(ms: number) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');

    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
