import { Head, Link } from '@inertiajs/react';
import { Wordmark } from '@/Components/ApplicationLogo';
import { buttonClass } from '@/Components/ui/Button';
import { useTrans } from '@/lib/i18n';

/** A rest on the staff: the page that isn't there. */
export default function Error({ status }: { status: number }) {
    const { t } = useTrans();
    const message = t(`error_${status}`) !== `error_${status}` ? t(`error_${status}`) : t('error_500');

    return (
        <>
            <Head title={`${status}`} />
            <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
                <Wordmark className="mb-10" />
                <svg viewBox="0 0 160 70" className="w-40" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <line key={i} x1="0" x2="160" y1={10 + i * 12} y2={10 + i * 12} className="stroke-staff" strokeWidth="1.5" />
                    ))}
                    <rect x="68" y="22" width="24" height="10" rx="1" className="fill-primary" />
                </svg>
                <p className="tabular mt-6 text-sm font-bold text-primary">{status}</p>
                <h1 className="mt-2 max-w-md text-2xl font-bold tracking-tight">{message}</h1>
                <Link href="/" className={buttonClass('primary', 'lg', 'mt-8')}>
                    {t('go_home')}
                </Link>
            </div>
        </>
    );
}
