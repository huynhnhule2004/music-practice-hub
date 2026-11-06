import { InertiaFormProps } from '@inertiajs/react';
import { ChoiceChips, Field, Input, Select } from '@/Components/ui/Field';
import { useTrans } from '@/lib/i18n';
import { Instrument } from '@/types';

export type SongFormData = {
    title: string;
    artist: string;
    genre: string;
    instrument_id: number | '';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    default_target_bpm: number | '';
};

export const emptySong: SongFormData = {
    title: '',
    artist: '',
    genre: '',
    instrument_id: '',
    difficulty: 'beginner',
    default_target_bpm: '',
};

/** Title / composer / instrument / difficulty / tempo, shared by member and admin forms. */
export default function SongFields({ form, instruments }: { form: InertiaFormProps<SongFormData>; instruments: Instrument[] }) {
    const { t } = useTrans();
    const { data, setData, errors } = form;

    return (
        <div className="space-y-5">
            <Field label={t('title')} error={errors.title}>
                {(id, d) => <Input id={id} aria-describedby={d} value={data.title} onChange={(e) => setData('title', e.target.value)} required maxLength={160} />}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('artist')} optional error={errors.artist}>
                    {(id, d) => <Input id={id} aria-describedby={d} value={data.artist} onChange={(e) => setData('artist', e.target.value)} maxLength={120} />}
                </Field>
                <Field label={t('genre')} optional error={errors.genre}>
                    {(id, d) => <Input id={id} aria-describedby={d} value={data.genre} onChange={(e) => setData('genre', e.target.value)} maxLength={60} />}
                </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('instrument')} error={errors.instrument_id}>
                    {(id, d) => (
                        <Select
                            id={id}
                            aria-describedby={d}
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
                <Field label={t('target_tempo')} optional error={errors.default_target_bpm}>
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
                                value={data.default_target_bpm}
                                onChange={(e) => setData('default_target_bpm', e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>
                    )}
                </Field>
            </div>
            <div>
                <p className="mb-2 text-sm font-medium">{t('difficulty')}</p>
                <ChoiceChips
                    label={t('difficulty')}
                    value={data.difficulty}
                    onChange={(v) => setData('difficulty', v)}
                    options={(['beginner', 'intermediate', 'advanced'] as const).map((v) => ({ value: v, label: t(`difficulty_${v}`) }))}
                />
            </div>
        </div>
    );
}
