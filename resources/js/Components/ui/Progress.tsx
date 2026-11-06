export default function Progress({
    value,
    max = 100,
    tone = 'primary',
    label,
    className = '',
}: {
    value: number;
    max?: number;
    tone?: 'primary' | 'amber' | 'coral';
    label?: string;
    className?: string;
}) {
    const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
    const fill = { primary: 'bg-primary', amber: 'bg-brass', coral: 'bg-coral' }[tone];

    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Math.min(value, max)}
            className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}
        >
            <div className={`h-full rounded-full ${fill} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
        </div>
    );
}
