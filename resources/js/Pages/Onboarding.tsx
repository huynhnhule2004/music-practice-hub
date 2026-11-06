import { Head, useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { Wordmark } from '@/Components/ApplicationLogo';
import { LanguageSwitcher } from '@/Components/LanguageSwitcher';
import { ThemeToggle } from '@/Components/ThemeToggle';
import Button from '@/Components/ui/Button';
import { useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { Instrument, PageProps } from '@/types';

type Level = 'beginner' | 'intermediate' | 'advanced';
type Song = { id: number; title: string; artist: string | null; instrument_id: number; difficulty: string };

const GOALS = [10, 20, 30, 45, 60];

export default function Onboarding({ instruments, library }: PageProps<{ instruments: Instrument[]; library: Song[] }>) {
    const { t } = useTrans();
    const [step, setStep] = useState(0);

    const form = useForm({
        instruments: [] as { id: number; level: Level }[],
        daily_goal_minutes: 30,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        songs: [] as number[],
    });

    const picked = new Map(form.data.instruments.map((i) => [i.id, i.level]));
    const toggleInstrument = (id: number) =>
        form.setData(
            'instruments',
            picked.has(id) ? form.data.instruments.filter((i) => i.id !== id) : [...form.data.instruments, { id, level: 'beginner' }],
        );
    const setLevel = (id: number, level: Level) => form.setData('instruments', form.data.instruments.map((i) => (i.id === id ? { ...i, level } : i)));
    const toggleSong = (id: number) => form.setData('songs', form.data.songs.includes(id) ? form.data.songs.filter((s) => s !== id) : [...form.data.songs, id]);

    const relevant = library.filter((s) => picked.has(s.instrument_id));
    const steps = [t('step_instruments'), t('step_goal'), t('step_pieces')];
    const canContinue = step !== 0 || form.data.instruments.length > 0;

    const submit = () => form.post(route('onboarding.store'));

    return (
        <>
            <Head title={t('onboarding_title')} />
            <div className="flex min-h-dvh flex-col bg-background">
                <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-5">
                    <Wordmark />
                    <div className="flex gap-2">
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>
                </header>

                <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32">
                    {/* Progress: a real sequence, so numbered steps fit */}
                    <ol className="mb-8 flex gap-2" aria-label={t('step_of', { step: step + 1, total: 3 })}>
                        {steps.map((label, i) => (
                            <li key={label} className="flex-1">
                                <div className={`h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
                                <span className="sr-only">{label}</span>
                            </li>
                        ))}
                    </ol>
                    <p className="text-sm font-semibold text-primary">{t('step_of', { step: step + 1, total: 3 })}</p>

                    {step === 0 && (
                        <section>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('step_instruments')}</h1>
                            <p className="mt-2 text-muted-foreground">{t('step_instruments_body')}</p>
                            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                                {instruments.map((instrument) => {
                                    const on = picked.has(instrument.id);
                                    return (
                                        <li key={instrument.id} className={`rounded-xl border-2 bg-card transition-colors ${on ? 'border-primary' : 'border-border'}`}>
                                            <button
                                                type="button"
                                                aria-pressed={on}
                                                onClick={() => toggleInstrument(instrument.id)}
                                                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                                            >
                                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: instrumentColor(instrument.id) }} />
                                                <span className="flex-1 font-semibold">{instrument.name}</span>
                                                <span
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}
                                                >
                                                    {on && <Check className="h-4 w-4" />}
                                                </span>
                                            </button>
                                            {on && (
                                                <div className="flex gap-1 border-t border-border p-2" role="radiogroup" aria-label={t('level')}>
                                                    {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                                                        <button
                                                            key={level}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={picked.get(instrument.id) === level}
                                                            onClick={() => setLevel(instrument.id, level)}
                                                            className={`h-9 flex-1 rounded-lg text-xs font-semibold ${
                                                                picked.get(instrument.id) === level ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                                                            }`}
                                                        >
                                                            {t(`level_${level}`)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            {form.errors.instruments && <p className="mt-3 text-sm font-medium text-destructive">{form.errors.instruments}</p>}
                        </section>
                    )}

                    {step === 1 && (
                        <section>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('step_goal')}</h1>
                            <p className="mt-2 text-muted-foreground">{t('step_goal_body')}</p>
                            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5" role="radiogroup" aria-label={t('daily_goal')}>
                                {GOALS.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        role="radio"
                                        aria-checked={form.data.daily_goal_minutes === m}
                                        onClick={() => form.setData('daily_goal_minutes', m)}
                                        className={`rounded-2xl border-2 px-3 py-5 text-center transition-colors ${
                                            form.data.daily_goal_minutes === m ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="tabular block text-3xl font-bold">{m}</span>
                                        <span className="text-sm text-muted-foreground">{t('minutes_short')}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="mt-6 text-sm text-muted-foreground">
                                {t('timezone')}: <span className="font-semibold text-foreground">{form.data.timezone}</span>
                            </p>
                        </section>
                    )}

                    {step === 2 && (
                        <section>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('step_pieces')}</h1>
                            <p className="mt-2 text-muted-foreground">{t('step_pieces_body')}</p>
                            <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
                                {(relevant.length ? relevant : library).map((song) => {
                                    const on = form.data.songs.includes(song.id);
                                    return (
                                        <li key={song.id}>
                                            <button type="button" aria-pressed={on} onClick={() => toggleSong(song.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: instrumentColor(song.instrument_id) }} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-semibold">{song.title}</span>
                                                    <span className="block truncate text-sm text-muted-foreground">
                                                        {[song.artist, t(`difficulty_${song.difficulty}`)].filter(Boolean).join(' · ')}
                                                    </span>
                                                </span>
                                                <span
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}
                                                >
                                                    {on && <Check className="h-4 w-4" />}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}
                </main>

                {/* Actions pinned to the thumb zone */}
                <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
                    <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
                        {step > 0 ? (
                            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                                {t('back')}
                            </Button>
                        ) : (
                            <span />
                        )}
                        {step < 2 ? (
                            <Button size="lg" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                                {t('next')}
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                {form.data.songs.length === 0 && (
                                    <Button variant="ghost" size="lg" onClick={submit} disabled={form.processing}>
                                        {t('skip')}
                                    </Button>
                                )}
                                <Button size="lg" onClick={submit} disabled={form.processing}>
                                    {t('finish_setup')}
                                </Button>
                            </div>
                        )}
                    </div>
                </footer>
            </div>
        </>
    );
}
