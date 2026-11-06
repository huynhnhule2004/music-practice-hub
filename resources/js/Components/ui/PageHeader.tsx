import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { ReactNode } from 'react';

export default function PageHeader({
    title,
    description,
    actions,
    back,
}: {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    back?: { href: string; label: string };
}) {
    return (
        <header className="mb-6 sm:mb-8">
            {back && (
                <Link
                    href={back.href}
                    className="-ml-2 mb-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" />
                    {back.label}
                </Link>
            )}
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                    <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
                    {description && <p className="mt-1.5 max-w-2xl text-muted-foreground">{description}</p>}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
        </header>
    );
}
