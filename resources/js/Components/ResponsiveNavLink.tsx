import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            aria-current={active ? 'page' : undefined}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 text-base font-medium transition-colors ${
                active
                    ? 'border-primary bg-muted text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-staff hover:bg-muted hover:text-foreground'
            } ${className}`}
        >
            {children}
        </Link>
    );
}
