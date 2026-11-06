import { Link } from '@inertiajs/react';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import Progress from '@/Components/ui/Progress';
import { intlLocale, useTrans } from '@/lib/i18n';
import { Goal } from '@/types';

export default function GoalCard({ goal, entryId, compact = false }: { goal: Goal; entryId?: number; compact?: boolean }) {
    const { t, locale } = useTrans();
    const deadline = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' }).format(new Date(goal.deadline_date));

    const when = goal.is_completed
        ? null
        : goal.days_left === 0
          ? t('due_today')
          : goal.is_overdue
            ? t('overdue_by', { count: Math.abs(goal.days_left) })
            : t('days_left', { count: goal.days_left });

    const body = (
        <div
            className={`rounded-2xl border p-4 ${
                goal.is_completed ? 'border-border bg-card' : 'border-brass/40 bg-gradient-to-br from-brass/15 via-card to-card'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    {!compact && goal.song && <p className="truncate text-sm text-muted-foreground">{goal.song.title}</p>}
                    <p className="font-semibold">{compact && goal.song ? goal.song.title : goal.title}</p>
                </div>
                <p className="tabular shrink-0 text-xl font-bold tracking-tight">♩{goal.target_bpm}</p>
            </div>

            <div className="mt-3 flex items-center gap-3">
                <span className="tabular w-10 shrink-0 text-xs font-semibold text-muted-foreground">♩{goal.current_bpm ?? goal.start_bpm ?? '–'}</span>
                <Progress value={goal.progress} tone={goal.is_completed ? 'primary' : 'amber'} label={goal.title} className="flex-1" />
                <span className="tabular w-10 shrink-0 text-right text-xs font-semibold text-muted-foreground">{goal.progress}%</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {goal.is_completed ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('completed_goals')}
                    </span>
                ) : (
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${goal.is_overdue ? 'text-coral' : 'text-brass-ink'}`}>
                        <CalendarClock className="h-4 w-4" />
                        {when} · {deadline}
                    </span>
                )}
                {goal.bpm_per_week !== null && goal.bpm_per_week > 0 && (
                    <span className="text-muted-foreground">{t('pace_hint', { bpm: goal.bpm_per_week })}</span>
                )}
            </div>
        </div>
    );

    return entryId ? (
        <Link href={route('repertoire.show', entryId)} className="block rounded-xl transition-transform hover:-translate-y-px">
            {body}
        </Link>
    ) : (
        body
    );
}
