import { router } from '@inertiajs/react';
import { CheckCircle2, PartyPopper, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTrans } from '@/lib/i18n';

type ToastFlash = { message: string; undo?: string };
type Celebrate = { kind: 'welcome' | 'mastered'; title?: string };
type GoalReached = { title: string; target_bpm: number };

type ItemData =
    | { kind: 'toast'; message: string; undo?: string }
    | { kind: 'celebrate'; title: string; body: string; icon: 'trophy' | 'party' };

type Item = ItemData & { id: number };

/**
 * Listens for Inertia flash data (Inertia::flash on the server) and shows it:
 * plain toasts with an optional Undo, and a richer card for celebrations.
 */
export default function Toaster() {
    const { t } = useTrans();
    const [items, setItems] = useState<Item[]>([]);
    const nextId = useRef(1);

    const push = (item: ItemData, ttl = 4500) => {
        const id = nextId.current++;
        setItems((current) => [...current.slice(-2), { ...item, id }]);
        window.setTimeout(() => setItems((current) => current.filter((i) => i.id !== id)), ttl);
    };

    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = event.detail.flash as {
                toast?: ToastFlash;
                celebrate?: Celebrate;
                goalReached?: GoalReached;
            };

            if (flash.goalReached) {
                push(
                    {
                        kind: 'celebrate',
                        icon: 'trophy',
                        title: t('goal_reached_title'),
                        body: t('goal_reached_body', { bpm: flash.goalReached.target_bpm, title: flash.goalReached.title }),
                    },
                    7000,
                );
            }

            if (flash.celebrate) {
                const welcome = flash.celebrate.kind === 'welcome';
                push(
                    {
                        kind: 'celebrate',
                        icon: welcome ? 'party' : 'trophy',
                        title: welcome ? t('welcome_title') : t('mastered_title'),
                        body: welcome ? t('welcome_body') : t('mastered_body', { title: flash.celebrate.title ?? '' }),
                    },
                    6500,
                );
            }

            if (flash.toast) {
                push({ kind: 'toast', message: flash.toast.message, undo: flash.toast.undo }, flash.toast.undo ? 7000 : 4000);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dismiss = (id: number) => setItems((current) => current.filter((i) => i.id !== id));

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
        >
            {items.map((item) =>
                item.kind === 'toast' ? (
                    <div
                        key={item.id}
                        role="status"
                        className="toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-foreground py-2.5 pl-4 pr-2 text-sm font-medium text-background shadow-xl"
                    >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                        <span className="py-1">{item.message}</span>
                        {item.undo ? (
                            <button
                                type="button"
                                className="ml-1 h-9 rounded-lg px-3 font-semibold text-brass hover:bg-background/10"
                                onClick={() => {
                                    dismiss(item.id);
                                    router.post(item.undo!, {}, { preserveScroll: true });
                                }}
                            >
                                {t('undo')}
                            </button>
                        ) : (
                            <span className="w-2" />
                        )}
                    </div>
                ) : (
                    <div
                        key={item.id}
                        role="status"
                        className="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-brass/40 bg-card p-4 shadow-2xl"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass/20 text-brass-ink">
                            {item.icon === 'trophy' ? <Trophy className="h-5 w-5" /> : <PartyPopper className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold">{item.title}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                        </div>
                    </div>
                ),
            )}
        </div>
    );
}
