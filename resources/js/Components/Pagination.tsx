import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Paginated } from '@/types';

export default function Pagination({ page }: { page: Paginated<unknown> }) {
    if (page.last_page <= 1) return null;

    return (
        <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Pagination">
            <span className="tabular text-sm text-muted-foreground">
                {page.current_page} / {page.last_page} · {page.total}
            </span>
            <div className="flex gap-2">
                <PageLink href={page.prev_page_url} label="Previous">
                    <ChevronLeft className="h-4 w-4" />
                </PageLink>
                <PageLink href={page.next_page_url} label="Next">
                    <ChevronRight className="h-4 w-4" />
                </PageLink>
            </div>
        </nav>
    );
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
    const cls = 'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-card';

    return href ? (
        <Link href={href} preserveScroll aria-label={label} className={`${cls} hover:bg-muted`}>
            {children}
        </Link>
    ) : (
        <span aria-hidden="true" className={`${cls} opacity-40`}>
            {children}
        </span>
    );
}
