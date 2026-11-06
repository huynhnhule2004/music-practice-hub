import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Guitar, LayoutDashboard, Library, Users } from 'lucide-react';
import { PropsWithChildren } from 'react';
import { Wordmark } from '@/Components/ApplicationLogo';
import { LanguageSwitcher } from '@/Components/LanguageSwitcher';
import { ThemeToggle } from '@/Components/ThemeToggle';
import Toaster from '@/Components/ui/Toaster';
import { useTrans } from '@/lib/i18n';

/** Admin chrome: denser, sidebar on desktop, scrollable tabs on phones. */
export default function AdminLayout({ children }: PropsWithChildren) {
    const { t } = useTrans();
    const { pendingReviews } = usePage().props;

    const items = [
        { href: route('admin.overview'), label: t('admin.overview'), icon: LayoutDashboard, active: route().current('admin.overview') },
        { href: route('admin.library.index'), label: t('admin.library'), icon: Library, active: route().current('admin.library.*'), badge: pendingReviews },
        { href: route('admin.instruments.index'), label: t('admin.instruments'), icon: Guitar, active: route().current('admin.instruments.*') },
        { href: route('admin.users.index'), label: t('admin.users'), icon: Users, active: route().current('admin.users.*') },
    ];

    return (
        <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[240px_1fr]">
            <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
                <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-5">
                    <Link href={route('admin.overview')} className="flex items-center gap-2 rounded-md">
                        <Wordmark />
                        <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">{t('admin.title')}</span>
                    </Link>
                    <div className="flex gap-2 lg:hidden">
                        <ThemeToggle />
                    </div>
                </div>

                <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0" aria-label={t('admin.title')}>
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={item.active ? 'page' : undefined}
                            className={`flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
                                item.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            {item.badge ? (
                                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
                                    {item.badge}
                                </span>
                            ) : null}
                        </Link>
                    ))}
                </nav>

                <div className="hidden px-3 pt-6 lg:block">
                    <Link href={route('dashboard')} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        {t('admin.back_to_app')}
                    </Link>
                    <div className="mt-4 flex gap-2 px-3">
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>
                </div>
            </aside>

            <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
                <div className="mx-auto max-w-6xl">{children}</div>
                <div className="mt-10 text-center lg:hidden">
                    <Link href={route('dashboard')} className="text-sm font-semibold text-primary">
                        {t('admin.back_to_app')}
                    </Link>
                </div>
            </main>
            <Toaster />
        </div>
    );
}
