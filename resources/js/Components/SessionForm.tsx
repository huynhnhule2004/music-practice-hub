import { InertiaFormProps } from '@inertiajs/react';
import { ChoiceChips, Field, Input, Select, Textarea } from '@/Components/ui/Field';
import { useTrans } from '@/lib/i18n';
import { Instrument } from '@/types';

export type SessionFormData = {
    song_id: number | '';
    instrument_id: number | '';
    start_time: string;
    duration_minutes: number | '';
    achieved_bpm: number | '';
    rating: number | null;
    notes: string;
};

type PickerSong = { id: number; title: string; artist: string | null; instrument_id: number; in_repertoire?: boolean };

const DURATIONS = [15, 30, 45, 60, 90];

/** Fields shared by "Log a session" and "Edit session". */
export default function SessionForm({
    form,
    songs,
    instruments,
}: {
    form: InertiaFormProps<SessionFormData>;
    songs: PickerSong[];
    instruments: Instrument[];
}) {
    const { t } = useTrans();
    const { data, setData, errors } = form;
    const mine = songs.filter((s) => s.in_repertoire);
    const rest = songs.filter((s) => !s.in_repertoire);

    const chooseSong = (value: string) => {
        const song = songs.find((s) => s.id === Number(value));
        setData((current) => ({
            ...current,
            song_id: value ? Number(value) : '',
            instrument_id: song ? song.instrument_id : current.instrument_id,
        }));
    };

    const option = (s: PickerSong) => (
        <option key={s.id} value={s.id}>
            {s.artist ? `${s.title} — ${s.artist}` : s.title}
        </option>
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-[3fr_2fr]">
                <Field label={t('piece')} error={errors.song_id}>
                    {(id, describedBy) => (
                        <Select id={id} aria-describedby={describedBy} value={data.song_id} onChange={(e) => chooseSong(e.target.value)} required>
                            <option value="">{t('choose_piece')}</option>
                            {mine.length > 0 && rest.length > 0 ? (
                                <>
                                    <optgroup label={t('your_pieces')}>{mine.map(option)}</optgroup>
                                    <optgroup label={t('library')}>{rest.map(option)}</optgroup>
                                </>
                            ) : (
                                songs.map(option)
                            )}
                        </Select>
                    )}
                </Field>

                <Field label={t('instrument')} error={errors.instrument_id}>
                    {(id, describedBy) => (
                        <Select
                            id={id}
                            aria-describedby={describedBy}
                            value={data.instrument_id}
                            onChange={(e) => setData('instrument_id', e.target.value ? Number(e.target.value) : '')}
                            required
                        >
                            <option value="">{t('choose_instrument')}</option>
                            {instruments.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium">{t('duration')}</p>
                <div className="flex flex-wrap items-center gap-2">
                    <ChoiceChips
                        label={t('duration')}
                        value={data.duration_minutes === '' ? null : data.duration_minutes}
                        onChange={(v) => setData('duration_minutes', v)}
                        options={DURATIONS.map((m) => ({ value: m, label: m }))}
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={600}
                            className="tabular w-24"
                            value={data.duration_minutes}
                            onChange={(e) => setData('duration_minutes', e.target.value === '' ? '' : Number(e.target.value))}
                            aria-label={t('duration')}
                            required
                        />
                        <span className="text-sm text-muted-foreground">{t('minutes_short')}</span>
                    </div>
                </div>
                {errors.duration_minutes && <p className="mt-1.5 text-sm font-medium text-destructive">{errors.duration_minutes}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('started_at')} error={errors.start_time}>
                    {(id, describedBy) => (
                        <Input
                            id={id}
                            aria-describedby={describedBy}
                            type="datetime-local"
                            value={data.start_time}
                            onChange={(e) => setData('start_time', e.target.value)}
                            required
                        />
                    )}
                </Field>

                <Field label={t('tempo_reached')} optional error={errors.achieved_bpm}>
                    {(id, describedBy) => (
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">♩ =</span>
                            <Input
                                id={id}
                                aria-describedby={describedBy}
                                type="number"
                                inputMode="numeric"
                                min={20}
                                max={400}
                                className="tabular pl-11"
                                value={data.achieved_bpm}
                                onChange={(e) => setData('achieved_bpm', e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>
                    )}
                </Field>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium">
                    {t('rating')} <span className="font-normal text-muted-foreground">({t('optional')})</span>
                </p>
                <ChoiceChips
                    label={t('rating')}
                    value={data.rating}
                    onChange={(v) => setData('rating', data.rating === v ? null : v)}
                    options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: t(`rating_${n}`) }))}
                />
            </div>

            <Field label={t('notes')} optional error={errors.notes}>
                {(id) => <Textarea id={id} rows={3} placeholder={t('notes_placeholder')} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />}
            </Field>
        </div>
    );
}
