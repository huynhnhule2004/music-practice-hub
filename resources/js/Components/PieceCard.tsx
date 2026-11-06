import { Link } from '@inertiajs/react';
import { Music2, Play, Target } from 'lucide-react';
import { useRelativeDay, useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { RepertoireEntry } from '@/types';

/** A piece in the repertoire, tinted with its instrument's colour, with a one-tap way to practise it. */
export default function PieceCard({ entry, showPlay = true }: { entry: RepertoireEntry; showPlay?: boolean }) {
    const { t } = useTrans();
    const relativeDay = useRelativeDay();
    const color = instrumentColor(entry.instrument?.id);

    return (
        <div
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{
                borderColor: instrumentColor(entry.instrument?.id, 0.25),
                backgroundImage: `linear-gradient(135deg, ${instrumentColor(entry.instrument?.id, 0.12)}, transparent 60%)`,
            }}
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: color }} aria-hidden="true">
                <Music2 className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
                <Link href={route('repertoire.show', entry.id)} className="after:absolute after:inset-0 after:rounded-2xl">
                    <p className="truncate font-semibold">{entry.title}</p>
                </Link>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {[entry.artist, entry.instrument?.name].filter(Boolean).join(' — ')}
                </p>

                <div className="mt-3">
                    <TempoLine best={entry.best_bpm} target={entry.target_bpm} progress={entry.progress} color={color} />
                </div>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {entry.has_goal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brass/15 px-2 py-0.5 font-semibold text-brass-ink">
                            <Target className="h-3.5 w-3.5" />
                            {t('goal_due')}
                        </span>
                    )}
                    <span>
                        {entry.days_since === null ? t('not_practised_yet') : t('last_practised', { when: relativeDay(entry.days_since) })}
                    </span>
                </p>
            </div>

            {showPlay && (
                <Link
                    href={route('practice.session', { song: entry.song_id })}
                    aria-label={`${t('practise_this')}: ${entry.title}`}
                    className="relative z-10 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: color, boxShadow: `0 6px 16px -6px ${instrumentColor(entry.instrument?.id, 0.7)}` }}
                >
                    <Play className="h-5 w-5 translate-x-px fill-current" />
                </Link>
            )}
        </div>
    );
}

/** best ──────●────── target, or a plain progress bar when no tempo is tracked. */
export function TempoLine({ best, target, progress, color }: { best: number | null; target: number | null; progress: number; color?: string }) {
    const fill = color ?? 'hsl(var(--primary))';

    return (
        <div className="flex w-full items-center gap-2.5">
            {target ? <span className="tabular w-11 shrink-0 text-xs font-semibold text-muted-foreground">♩{best ?? '–'}</span> : null}
            <div className="relative h-2 flex-1 rounded-full bg-muted">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${progress}%`, backgroundColor: fill }} />
                {target && (
                    <span
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card"
                        style={{ left: `${Math.max(progress, 4)}%`, backgroundColor: fill }}
                        aria-hidden="true"
                    />
                )}
            </div>
            <span className="tabular w-11 shrink-0 text-right text-xs font-semibold text-muted-foreground">{target ? `♩${target}` : `${progress}%`}</span>
        </div>
    );
}
