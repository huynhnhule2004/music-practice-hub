import { Link, usePage } from '@inertiajs/react';
import { BarChart3, CalendarDays, Home, Library, Play, Shield, Target, UserRound } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';
import { Wordmark } from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { LanguageSwitcher } from '@/Components/LanguageSwitcher';
import { ThemeToggle } from '@/Components/ThemeToggle';
import Toaster from '@/Components/ui/Toaster';
import { useTrans } from '@/lib/i18n';

type NavItem = { name: string; label: string; href: string; icon: typeof Home; match: string[] };

/**
 * App shell. Phones get a bottom tab bar with a raised Practise button (thumb reach);
 * larger screens get a top bar. The page content is identical in both.
 */
export default function AuthenticatedLayout({ children, wide = false }: PropsWithChildren<{ header?: ReactNode; wide?: boolean }>) {
    const { auth, pendingReviews } = usePage().props;
    const { t } = useTrans();
    const user = auth.user;

    const primary: NavItem[] = [
        { name: 'today', label: t('nav_today'), href: route('dashboard'), icon: Home, match: ['dashboard'] },
        { name: 'pieces', label: t('nav_pieces'), href: route('repertoire.index'), icon: Library, match: ['repertoire.*'] },
        { name: 'history', label: t('nav_history'), href: route('history'), icon: CalendarDays, match: ['history'] },
        { name: 'me', label: t('nav_me'), href: route('profile.edit'), icon: UserRound, match: ['profile.*'] },
    ];

    const secondary: NavItem[] = [
        { name: 'goals', label: t('nav_goals'), href: route('goals.index'), icon: Target, match: ['goals.*'] },
        { name: 'insights', label: t('nav_insights'), href: route('insights'), icon: BarChart3, match: ['insights'] },
    ];

    const isActive = (item: NavItem) => item.match.some((pattern) => route().current(pattern));
    const practising = route().current('practice.*');

    return (
        <div className="min-h-dvh bg-background">
            {/* Top bar */}
            <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
                    <Link href={route('dashboard')} className="shrink-0 rounded-md">
                        <Wordmark />
                    </Link>

                    <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
                        {[...primary.slice(0, 3), ...secondary].map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                aria-current={isActive(item) ? 'page' : undefined}
                                className={`inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition-colors ${
                                    isActive(item) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        {user.is_admin && (
                            <Link
                                href={route('admin.overview')}
                                className="relative hidden h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
                            >
                                <Shield className="h-4 w-4" />
                                {t('nav_admin')}
                                {pendingReviews > 0 && (
                                    <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
                                        {pendingReviews}
                                    </span>
                                )}
                            </Link>
                        )}

                        <Link
                            href={route('practice.session')}
                            className="btn-brand hidden h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold lg:inline-flex"
                        >
                            <Play className="h-4 w-4 fill-current" />
                            {t('nav_practise')}
                        </Link>

                        {/* Goals & insights live in the top bar on phones, the tab bar has room for five */}
                        <Link
                            href={route('goals.index')}
                            aria-label={t('nav_goals')}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg lg:hidden ${
                                route().current('goals.*') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            <Target className="h-5 w-5" />
                        </Link>
                        <Link
                            href={route('insights')}
                            aria-label={t('nav_insights')}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg lg:hidden ${
                                route().current('insights') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            <BarChart3 className="h-5 w-5" />
                        </Link>

                        <div className="hidden items-center gap-2 lg:flex">
                            <ThemeToggle />
                            <LanguageSwitcher />
                        </div>

                        <div className="hidden lg:block">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                                        title={user.name}
                                    >
                                        {initials(user.name)}
                                        <span className="sr-only">{user.name}</span>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <div className="border-b border-border px-4 py-2.5">
                                        <p className="truncate text-sm font-semibold">{user.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')}>{t('nav_me')}</Dropdown.Link>
                                    {user.is_admin && <Dropdown.Link href={route('admin.overview')}>{t('nav_admin')}</Dropdown.Link>}
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        {t('log_out')}
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </header>

            <main className={`mx-auto px-4 pb-32 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pb-16 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>{children}</main>

            {/* Bottom tab bar (phones and tablets) */}
            <nav
                aria-label="Main"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
            >
                <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch">
                    {primary.slice(0, 2).map((item) => (
                        <TabLink key={item.name} item={item} active={isActive(item)} />
                    ))}

                    <div className="flex items-start justify-center">
                        <Link
                            href={route('practice.session')}
                            aria-label={t('nav_practise')}
                            aria-current={practising ? 'page' : undefined}
                            className="btn-brand -mt-5 flex h-16 w-16 flex-col items-center justify-center rounded-full shadow-lg shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
                        >
                            <Play className="h-6 w-6 translate-x-px fill-current" />
                            <span className="mt-0.5 text-[10px] font-bold">{t('nav_practise')}</span>
                        </Link>
                    </div>

                    {primary.slice(2).map((item) => (
                        <TabLink key={item.name} item={item} active={isActive(item)} />
                    ))}
                </div>
            </nav>

            <Toaster />
        </div>
    );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
            <Icon className={`h-[22px] w-[22px] ${active ? 'stroke-[2.4]' : ''}`} />
            {item.label}
        </Link>
    );
}

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}
