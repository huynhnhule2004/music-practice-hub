import { Link } from '@inertiajs/react';
import { Play, Target } from 'lucide-react';
import { useRelativeDay, useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { RepertoireEntry } from '@/types';

/** A piece in the repertoire: where you are with it, and a one-tap way to practise it. */
export default function PieceCard({ entry, showPlay = true }: { entry: RepertoireEntry; showPlay?: boolean }) {
    const { t } = useTrans();
    const relativeDay = useRelativeDay();

    return (
        <div className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <span className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ backgroundColor: instrumentColor(entry.instrument?.id) }} aria-hidden="true" />

            <div className="min-w-0 flex-1">
                <Link href={route('repertoire.show', entry.id)} className="after:absolute after:inset-0 after:rounded-xl">
                    <p className="truncate font-semibold">{entry.title}</p>
                </Link>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {[entry.artist, entry.instrument?.name].filter(Boolean).join(' — ')}
                </p>

                <div className="mt-3 flex items-center gap-3">
                    <TempoLine best={entry.best_bpm} target={entry.target_bpm} progress={entry.progress} />
                </div>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {entry.has_goal && (
                        <span className="inline-flex items-center gap-1 font-semibold text-brass-ink">
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
                    className="relative z-10 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:bg-primary/90 active:scale-95"
                >
                    <Play className="h-5 w-5 translate-x-px fill-current" />
                </Link>
            )}
        </div>
    );
}

/** best ──────●────── target, or a plain progress bar when no tempo is tracked. */
export function TempoLine({ best, target, progress }: { best: number | null; target: number | null; progress: number }) {
    return (
        <div className="flex w-full items-center gap-2.5">
            {target ? (
                <span className="tabular w-11 shrink-0 text-xs font-semibold text-muted-foreground">♩{best ?? '–'}</span>
            ) : null}
            <div className="relative h-1.5 flex-1 rounded-full bg-muted">
                <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                {target && (
                    <span
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
                        style={{ left: `${Math.max(progress, 4)}%` }}
                        aria-hidden="true"
                    />
                )}
            </div>
            <span className="tabular w-11 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                {target ? `♩${target}` : `${progress}%`}
            </span>
        </div>
    );
}
