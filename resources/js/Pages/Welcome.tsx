import { Head, Link } from '@inertiajs/react';
import { Wordmark } from '@/Components/ApplicationLogo';
import { LanguageSwitcher } from '@/Components/LanguageSwitcher';
import PracticeStaff from '@/Components/PracticeStaff';
import StaffScroller from '@/Components/StaffScroller';
import { ThemeToggle } from '@/Components/ThemeToggle';
import { useTrans } from '@/lib/i18n';
import { PageProps, PracticeDay } from '@/types';

// A believable sample month: weekday practice, a few long weekend runs, some rests.
const SAMPLE_MINUTES = [20, 35, 0, 30, 45, 60, 0, 25, 30, 40, 0, 35, 75, 50, 15, 0, 30, 45, 30, 90, 40, 35, 30, 0, 50, 45, 65, 30];

export default function Welcome({ auth }: PageProps) {
    const { t } = useTrans();
    const sampleDays = sampleMonth();

    const features = [
        { title: t('feature_log_title'), body: t('feature_log_body') },
        { title: t('feature_streak_title'), body: t('feature_streak_body') },
        { title: t('feature_lang_title'), body: t('feature_lang_body') },
    ];

    return (
        <>
            <Head title="MusicHub" />

            <div className="min-h-screen bg-background">
                <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
                    <Wordmark />
                    <nav className="flex items-center gap-2 sm:gap-3">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                {t('open_dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="hidden h-9 items-center rounded-md px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:inline-flex"
                                >
                                    {t('log_in')}
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    {t('register')}
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
                    <section className="pt-12 sm:pt-20">
                        <h1 className="max-w-3xl text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
                            {t('hero_title')}
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('hero_body')}</p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link
                                href={auth.user ? route('dashboard') : route('register')}
                                className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                {auth.user ? t('open_dashboard') : t('get_started')}
                            </Link>
                            {!auth.user && (
                                <Link
                                    href={route('login')}
                                    className="inline-flex h-11 items-center rounded-md border border-input px-5 text-base font-semibold transition-colors hover:bg-muted"
                                >
                                    {t('log_in')}
                                </Link>
                            )}
                        </div>
                    </section>

                    <figure className="mt-14 sm:mt-16">
                        <div className="staff-panel rounded-xl px-3 pb-4 pt-2 sm:px-6 sm:pt-4">
                            <StaffScroller className="-mx-3 px-3 sm:mx-0 sm:px-0">
                                <PracticeStaff days={sampleDays} goal={30} animate className="min-w-[640px]" />
                            </StaffScroller>
                        </div>
                        <figcaption className="mt-3 text-sm text-muted-foreground">{t('demo_caption')}</figcaption>
                    </figure>

                    <section className="mt-16 grid gap-x-10 gap-y-8 border-t border-border pt-10 sm:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title}>
                                <h2 className="text-base font-semibold">{feature.title}</h2>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                            </div>
                        ))}
                    </section>
                </main>
            </div>
        </>
    );
}

function sampleMonth(): PracticeDay[] {
    const today = new Date();

    return SAMPLE_MINUTES.map((minutes, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (SAMPLE_MINUTES.length - 1 - i));

        return { date: toYmd(date), minutes };
    });
}

function toYmd(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
