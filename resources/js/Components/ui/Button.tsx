import { InertiaLinkProps, Link } from '@inertiajs/react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const base =
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 select-none';

const variants: Record<Variant, string> = {
    primary: 'btn-brand',
    secondary: 'border border-input bg-card text-foreground hover:bg-muted active:bg-border',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    amber: 'bg-brass text-[hsl(340_32%_13%)] hover:bg-brass/90',
};

// Every size is at least 40px tall; md and up meet the 44px touch target.
const sizes: Record<Size, string> = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
    xl: 'h-14 px-7 text-lg',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
    return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    icon?: ReactNode;
};

export default function Button({ variant = 'primary', size = 'md', icon, className = '', children, type = 'button', ...props }: ButtonProps) {
    return (
        <button type={type} className={buttonClass(variant, size, className)} {...props}>
            {icon}
            {children}
        </button>
    );
}

export function LinkButton({
    variant = 'primary',
    size = 'md',
    icon,
    className = '',
    children,
    ...props
}: Omit<InertiaLinkProps, 'size'> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
    return (
        <Link className={buttonClass(variant, size, className)} {...props}>
            {icon}
            {children}
        </Link>
    );
}

export function IconButton({
    label,
    className = '',
    children,
    type = 'button',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
