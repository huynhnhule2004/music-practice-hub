import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, ReactNode, useMemo, useState } from 'react';
import { useTheme } from '@/Components/ThemeProvider';
import Button from '@/Components/ui/Button';
import { ChoiceChips, Field, Select } from '@/Components/ui/Field';
import PageHeader from '@/Components/ui/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { intlLocale, useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { Instrument, PageProps } from '@/types';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

type Level = 'beginner' | 'intermediate' | 'advanced';

type Props = PageProps<{
    mustVerifyEmail: boolean;
    status?: string;
    preferences: { daily_goal_minutes: number; timezone: string; locale: string };
    myInstruments: { id: number; name: string; level: Level }[];
    instruments: Instrument[];
    export: { ready_at: string } | null;
}>;

export default function Edit({ mustVerifyEmail, status, preferences, myInstruments, instruments, export: exportFile }: Props) {
    const { t } = useTrans();

    return (
        <AuthenticatedLayout>
            <Head title={t('me_title')} />
            <PageHeader title={t('me_title')} />

            <div className="space-y-6">
                <Card title={t('practice_settings')} description={t('practice_settings_body')}>
                    <PracticeSettings preferences={preferences} />
                </Card>

                <Card title={t('my_instruments')} description={t('my_instruments_body')}>
                    <InstrumentSettings mine={myInstruments} all={instruments} />
                </Card>

                <Card title={t('appearance')}>
                    <Appearance />
                </Card>

                <Card title={t('account')}>
                    <div className="space-y-10">
                        <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} className="max-w-xl" />
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>
                </Card>

                <Card title={t('your_data')} description={t('your_data_body')}>
                    <ExportData file={exportFile} />
                </Card>

                <Card>
                    <DeleteUserForm className="max-w-xl" />
                </Card>

                <div className="pt-2 text-center lg:hidden">
                    <Link href={route('logout')} method="post" as="button" className="h-11 rounded-lg px-4 font-semibold text-muted-foreground hover:bg-muted">
                        {t('log_out')}
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Card({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            {title && (
                <header className="mb-5">
                    <h2 className="text-lg font-bold">{title}</h2>
                    {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
                </header>
            )}
            {children}
        </section>
    );
}

function PracticeSettings({ preferences }: { preferences: Props['preferences'] }) {
    const { t } = useTrans();
    const form = useForm(preferences);
    const zones = useMemo(() => {
        try {
            return Intl.supportedValuesOf('timeZone');
        } catch {
            return [preferences.timezone];
        }
    }, [preferences.timezone]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(route('settings.practice'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="max-w-xl space-y-5">
            <div>
                <p className="mb-2 text-sm font-medium">{t('daily_goal')}</p>
                <ChoiceChips
                    label={t('daily_goal')}
                    value={form.data.daily_goal_minutes}
                    onChange={(v) => form.setData('daily_goal_minutes', v)}
                    options={[10, 15, 20, 30, 45, 60, 90].map((m) => ({ value: m, label: `${m}` }))}
                />
                {form.errors.daily_goal_minutes && <p className="mt-1.5 text-sm text-destructive">{form.errors.daily_goal_minutes}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('timezone')} error={form.errors.timezone}>
                    {(id) => (
                        <Select id={id} value={form.data.timezone} onChange={(e) => form.setData('timezone', e.target.value)}>
                            {zones.map((z) => (
                                <option key={z} value={z}>
                                    {z.replaceAll('_', ' ')}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
                <Field label={t('language')} error={form.errors.locale}>
                    {(id) => (
                        <Select id={id} value={form.data.locale} onChange={(e) => form.setData('locale', e.target.value)}>
                            <option value="en">English</option>
                            <option value="vi">Tiếng Việt</option>
                        </Select>
                    )}
                </Field>
            </div>
            <Button type="submit" disabled={form.processing || !form.isDirty}>
                {t('save_changes')}
            </Button>
        </form>
    );
}

function InstrumentSettings({ mine, all }: { mine: Props['myInstruments']; all: Instrument[] }) {
    const { t } = useTrans();
    const [rows, setRows] = useState(mine.map(({ id, level }) => ({ id, level })));
    const [adding, setAdding] = useState('');
    const available = all.filter((i) => !rows.some((r) => r.id === i.id));
    const name = (id: number) => all.find((i) => i.id === id)?.name;
    const dirty = JSON.stringify(rows) !== JSON.stringify(mine.map(({ id, level }) => ({ id, level })));

    return (
        <div className="max-w-xl space-y-4">
            <ul className="divide-y divide-border rounded-xl border border-border">
                {rows.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: instrumentColor(row.id) }} />
                        <span className="min-w-[6rem] flex-1 font-semibold">{name(row.id)}</span>
                        <select
                            value={row.level}
                            aria-label={t('level')}
                            onChange={(e) => setRows(rows.map((r) => (r.id === row.id ? { ...r, level: e.target.value as Level } : r)))}
                            className="h-10 rounded-lg border border-input bg-card px-3 pr-8 text-sm"
                        >
                            {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                                <option key={l} value={l}>
                                    {t(`level_${l}`)}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            aria-label={t('delete')}
                            onClick={() => setRows(rows.filter((r) => r.id !== row.id))}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </li>
                ))}
            </ul>
            {available.length > 0 && (
                <div className="flex gap-2">
                    <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label={t('add_instrument')} className="h-11 flex-1 rounded-lg border border-input bg-card px-3 text-sm">
                        <option value="">{t('add_instrument')}…</option>
                        {available.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.name}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="secondary"
                        icon={<Plus className="h-4 w-4" />}
                        disabled={!adding}
                        onClick={() => {
                            setRows([...rows, { id: Number(adding), level: 'beginner' }]);
                            setAdding('');
                        }}
                    >
                        {t('add')}
                    </Button>
                </div>
            )}
            <Button disabled={!dirty} onClick={() => router.put(route('settings.instruments'), { instruments: rows }, { preserveScroll: true })}>
                {t('save_changes')}
            </Button>
        </div>
    );
}

function Appearance() {
    const { t } = useTrans();
    const { theme, setTheme } = useTheme();

    return (
        <ChoiceChips
            label={t('appearance')}
            value={theme}
            onChange={setTheme}
            options={[
                { value: 'light', label: t('theme_light') },
                { value: 'dark', label: t('theme_dark') },
                { value: 'system', label: t('theme_system') },
            ]}
        />
    );
}

function ExportData({ file }: { file: Props['export'] }) {
    const { t, locale } = useTrans();

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => router.post(route('settings.export'), {}, { preserveScroll: true })}>
                {t('export_csv')}
            </Button>
            {file && (
                <>
                    <a href={route('settings.export.download')} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                        <Download className="h-4 w-4" />
                        {t('download_export')}
                    </a>
                    <span className="text-sm text-muted-foreground">
                        {t('export_ready', { when: new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(file.ready_at)) })}
                    </span>
                </>
            )}
        </div>
    );
}
