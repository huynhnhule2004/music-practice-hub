import { ReactNode } from 'react';

type Tone = 'neutral' | 'primary' | 'amber' | 'coral' | 'success';

const tones: Record<Tone, string> = {
    neutral: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-brass/15 text-brass-ink',
    coral: 'bg-coral/12 text-coral',
    success: 'bg-[hsl(152_55%_40%/0.12)] text-[hsl(152_60%_30%)] dark:text-[hsl(152_55%_60%)]',
};

export default function Badge({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}>
            {children}
        </span>
    );
}
