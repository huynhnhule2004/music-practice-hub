import { Head } from '@inertiajs/react';
import { Library, Plus } from 'lucide-react';
import { useState } from 'react';
import PieceCard from '@/Components/PieceCard';
import { LinkButton } from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import PageHeader from '@/Components/ui/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTrans } from '@/lib/i18n';
import { PageProps, RepertoireEntry } from '@/types';

type Status = RepertoireEntry['status'];

export default function Index({ entries, counts }: PageProps<{ entries: RepertoireEntry[]; counts: Record<Status, number> }>) {
    const { t } = useTrans();
    const [tab, setTab] = useState<Status>(counts.learning > 0 || entries.length === 0 ? 'learning' : counts.polishing > 0 ? 'polishing' : 'mastered');
    const visible = entries.filter((e) => e.status === tab);

    const tabs: { value: Status; label: string }[] = [
        { value: 'learning', label: t('status_learning') },
        { value: 'polishing', label: t('status_polishing') },
        { value: 'mastered', label: t('status_mastered') },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t('pieces_title')} />
            <PageHeader
                title={t('pieces_title')}
                description={t('pieces_intro')}
                actions={
                    <LinkButton href={route('repertoire.create')} icon={<Plus className="h-4 w-4" />}>
                        {t('add_piece')}
                    </LinkButton>
                }
            />

            {entries.length === 0 ? (
                <EmptyState
                    icon={<Library className="h-6 w-6" />}
                    title={t('no_pieces_yet_title')}
                    body={t('no_pieces_yet_body')}
                    action={
                        <LinkButton href={route('repertoire.create')} icon={<Plus className="h-4 w-4" />}>
                            {t('add_piece')}
                        </LinkButton>
                    }
                />
            ) : (
                <>
                    <div role="tablist" aria-label={t('pieces_title')} className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
                        {tabs.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                role="tab"
                                aria-selected={tab === item.value}
                                onClick={() => setTab(item.value)}
                                className={`flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors ${
                                    tab === item.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {item.label}
                                <span className="tabular rounded-full bg-background/70 px-1.5 text-xs">{counts[item.value]}</span>
                            </button>
                        ))}
                    </div>

                    {visible.length === 0 ? (
                        <p className="py-10 text-center text-muted-foreground">{t('empty_status')}</p>
                    ) : (
                        <div role="tabpanel" className="grid gap-3 sm:grid-cols-2">
                            {visible.map((entry) => (
                                <PieceCard key={entry.id} entry={entry} showPlay={entry.status !== 'mastered'} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </AuthenticatedLayout>
    );
}
