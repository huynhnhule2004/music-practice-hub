import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Wordmark } from '@/Components/ApplicationLogo';
import { LanguageSwitcher } from '@/Components/LanguageSwitcher';
import { ThemeToggle } from '@/Components/ThemeToggle';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                <Link href="/" className="rounded-md">
                    <Wordmark />
                </Link>
                <div className="flex gap-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                </div>
            </header>

            <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
                <div className="w-full max-w-md rounded-lg border border-border bg-card px-6 py-8 text-card-foreground sm:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
