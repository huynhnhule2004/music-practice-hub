import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import Button from '@/Components/ui/Button';
import { Field, Input, Select } from '@/Components/ui/Field';
import Sheet from '@/Components/ui/Sheet';
import { useTrans } from '@/lib/i18n';

type PieceOption = { song_id: number; title: string; best_bpm: number | null; target_bpm: number | null; has_goal?: boolean };

/** New tempo goal. Suggests a target and a 4-week deadline so most people just press Save. */
export default function GoalForm({
    open,
    onClose,
    pieces,
    fixedSongId,
}: {
    open: boolean;
    onClose: () => void;
    pieces: PieceOption[];
    fixedSongId?: number;
}) {
    const { t } = useTrans();
    const fixed = pieces.find((p) => p.song_id === fixedSongId);
    const inFourWeeks = new Date(Date.now() + 28 * 864e5).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const suggestTarget = (p?: PieceOption) => p?.target_bpm ?? (p?.best_bpm ? p.best_bpm + 20 : 100);

    const form = useForm({
        song_id: (fixed?.song_id ?? '') as number | '',
        target_bpm: suggestTarget(fixed) as number | '',
        deadline_date: inFourWeeks,
        title: '',
    });

    const choose = (songId: number) => {
        const piece = pieces.find((p) => p.song_id === songId);
        form.setData((d) => ({ ...d, song_id: songId, target_bpm: suggestTarget(piece) }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('goals.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    };

    const selected = pieces.find((p) => p.song_id === form.data.song_id);

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={t('new_goal')}
            description={t('goals_intro')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="goal-form" disabled={form.processing || !form.data.song_id}>
                        {form.processing ? t('saving') : t('new_goal')}
                    </Button>
                </>
            }
        >
            <form id="goal-form" onSubmit={submit} className="space-y-5">
                {!fixedSongId && (
                    <Field label={t('goal_piece')} error={form.errors.song_id}>
                        {(id, d) => (
                            <Select id={id} aria-describedby={d} value={form.data.song_id} onChange={(e) => choose(Number(e.target.value))} required>
                                <option value="">{t('choose_piece')}</option>
                                {pieces.map((p) => (
                                    <option key={p.song_id} value={p.song_id} disabled={p.has_goal}>
                                        {p.title}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                )}
                {fixedSongId && form.errors.song_id && <p className="text-sm font-medium text-destructive">{form.errors.song_id}</p>}

                <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                        label={t('goal_target')}
                        error={form.errors.target_bpm}
                        hint={selected?.best_bpm ? t('now_at', { bpm: selected.best_bpm }) : t('no_tempo_yet')}
                    >
                        {(id, d) => (
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">♩ =</span>
                                <Input
                                    id={id}
                                    aria-describedby={d}
                                    type="number"
                                    inputMode="numeric"
                                    min={20}
                                    max={400}
                                    className="tabular pl-11"
                                    value={form.data.target_bpm}
                                    onChange={(e) => form.setData('target_bpm', e.target.value === '' ? '' : Number(e.target.value))}
                                    required
                                />
                            </div>
                        )}
                    </Field>
                    <Field label={t('goal_deadline')} error={form.errors.deadline_date}>
                        {(id, d) => (
                            <Input
                                id={id}
                                aria-describedby={d}
                                type="date"
                                min={today}
                                value={form.data.deadline_date}
                                onChange={(e) => form.setData('deadline_date', e.target.value)}
                                required
                            />
                        )}
                    </Field>
                </div>

                <Field label={t('goal_name')} optional error={form.errors.title}>
                    {(id) => <Input id={id} value={form.data.title} placeholder={t('goal_name_placeholder')} onChange={(e) => form.setData('title', e.target.value)} maxLength={120} />}
                </Field>
            </form>
        </Sheet>
    );
}
