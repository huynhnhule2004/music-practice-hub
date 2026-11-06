import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            aria-current={active ? 'page' : undefined}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition-colors ' +
                (active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-staff hover:text-foreground') +
                ' ' +
                className
            }
        >
            {children}
        </Link>
    );
}
