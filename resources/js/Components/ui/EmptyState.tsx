import { ReactNode } from 'react';

export default function EmptyState({
    icon,
    title,
    body,
    action,
    className = '',
}: {
    icon?: ReactNode;
    title: ReactNode;
    body?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={`rounded-xl border border-dashed border-input px-6 py-10 text-center ${className}`}>
            {icon && <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">{icon}</div>}
            <p className="font-semibold">{title}</p>
            {body && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </div>
    );
}
