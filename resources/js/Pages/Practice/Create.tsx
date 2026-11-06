import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import SessionForm, { SessionFormData } from '@/Components/SessionForm';
import Button, { LinkButton } from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import PageHeader from '@/Components/ui/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTrans } from '@/lib/i18n';
import { Instrument, PageProps } from '@/types';

type Song = { id: number; title: string; artist: string | null; instrument_id: number; in_repertoire: boolean };

export default function Create({ songs, instruments, selectedSongId, now }: PageProps<{ songs: Song[]; instruments: Instrument[]; selectedSongId: number | null; now: string }>) {
    const { t } = useTrans();
    const preselected = songs.find((s) => s.id === selectedSongId);

    const form = useForm<SessionFormData>({
        song_id: preselected?.id ?? '',
        instrument_id: preselected?.instrument_id ?? '',
        start_time: minusMinutes(now, 30),
        duration_minutes: 30,
        achieved_bpm: '',
        rating: null,
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('practice.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('log_session')} />
            <PageHeader title={t('log_session')} description={t('log_intro')} back={{ href: route('dashboard'), label: t('nav_today') }} />

            {songs.length === 0 ? (
                <EmptyState title={t('no_pieces')} action={<LinkButton href={route('repertoire.create')}>{t('add_piece')}</LinkButton>} />
            ) : (
                <form onSubmit={submit} className="max-w-2xl">
                    <SessionForm form={form} songs={songs} instruments={instruments} />
                    <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
                        <Button type="submit" size="lg" disabled={form.processing}>
                            {form.processing ? t('saving') : t('save_session')}
                        </Button>
                        <LinkButton href={route('dashboard')} variant="ghost" size="lg">
                            {t('cancel')}
                        </LinkButton>
                    </div>
                </form>
            )}
        </AuthenticatedLayout>
    );
}

/** `now` is the user's local "YYYY-MM-DDTHH:mm" from the server. */
function minusMinutes(local: string, minutes: number) {
    const [date, time] = local.split('T');
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    const dt = new Date(y, mo - 1, d, h, mi - minutes);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
