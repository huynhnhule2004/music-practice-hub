import { Head, router } from '@inertiajs/react';
import { Plus, Target } from 'lucide-react';
import { useState } from 'react';
import GoalCard from '@/Components/GoalCard';
import GoalForm from '@/Components/GoalForm';
import Button, { LinkButton } from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import PageHeader from '@/Components/ui/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTrans } from '@/lib/i18n';
import { Goal, PageProps } from '@/types';

type Piece = { song_id: number; title: string; artist: string | null; best_bpm: number | null; target_bpm: number | null; has_goal: boolean };

export default function Index({ active, completed, pieces }: PageProps<{ active: Goal[]; completed: Goal[]; pieces: Piece[] }>) {
    const { t } = useTrans();
    const [open, setOpen] = useState(false);
    const canAdd = pieces.some((p) => !p.has_goal);

    return (
        <AuthenticatedLayout>
            <Head title={t('goals_title')} />
            <PageHeader
                title={t('goals_title')}
                description={t('goals_intro')}
                actions={
                    canAdd && (
                        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
                            {t('new_goal')}
                        </Button>
                    )
                }
            />

            {active.length === 0 ? (
                <EmptyState
                    icon={<Target className="h-6 w-6" />}
                    title={t('no_goals_title')}
                    body={t('no_goals_body')}
                    action={
                        pieces.length === 0 ? (
                            <LinkButton href={route('repertoire.create')} icon={<Plus className="h-4 w-4" />}>
                                {t('add_piece')}
                            </LinkButton>
                        ) : (
                            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
                                {t('new_goal')}
                            </Button>
                        )
                    }
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {active.map((goal) => (
                        <div key={goal.id} className="space-y-2">
                            <GoalCard goal={goal} />
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.patch(route('goals.update', goal.id), { is_completed: true }, { preserveScroll: true })}
                                >
                                    {t('mark_done')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => confirm(t('delete') + '?') && router.delete(route('goals.destroy', goal.id), { preserveScroll: true })}
                                >
                                    {t('delete')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {completed.length > 0 && (
                <section className="mt-12" aria-labelledby="done-heading">
                    <h2 id="done-heading" className="mb-3 text-lg font-bold">
                        {t('completed_goals')}
                    </h2>
                    <div className="grid gap-3 opacity-90 md:grid-cols-2">
                        {completed.map((goal) => (
                            <div key={goal.id} className="space-y-2">
                                <GoalCard goal={goal} />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.patch(route('goals.update', goal.id), { is_completed: false }, { preserveScroll: true })}
                                >
                                    {t('reopen')}
                                </Button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <GoalForm open={open} onClose={() => setOpen(false)} pieces={pieces} />
        </AuthenticatedLayout>
    );
}
