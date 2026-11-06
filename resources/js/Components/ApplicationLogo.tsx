import { SVGAttributes } from 'react';

/** A single quarter note on a staff line: the app's mark. */
export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <line x1="1" x2="23" y1="17" y2="17" className="stroke-staff" strokeWidth="1.5" />
            <ellipse cx="9" cy="17" rx="4.2" ry="3" transform="rotate(-22 9 17)" className="fill-brass" />
            <line x1="12.8" x2="12.8" y1="16" y2="2.5" className="stroke-foreground" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

export function Wordmark({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <ApplicationLogo className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight text-foreground">MusicHub</span>
        </span>
    );
}
