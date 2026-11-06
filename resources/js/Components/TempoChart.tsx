import { intlLocale, useTrans } from '@/lib/i18n';

/**
 * Best tempo per session over time, with the target as a dashed brass line.
 * Inline SVG so it inherits theme tokens in light and dark.
 */
export default function TempoChart({ points, target }: { points: { date: string; bpm: number }[]; target: number | null }) {
    const { t, locale } = useTrans();
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' });

    const W = 640;
    const H = 200;
    const pad = { top: 16, right: 16, bottom: 28, left: 40 };
    const values = points.map((p) => p.bpm);
    const lo = Math.floor((Math.min(...values, target ?? Infinity) - 6) / 10) * 10;
    const hi = Math.ceil((Math.max(...values, target ?? 0) + 6) / 10) * 10;
    const x = (i: number) => pad.left + (points.length === 1 ? (W - pad.left - pad.right) / 2 : (i / (points.length - 1)) * (W - pad.left - pad.right));
    const y = (v: number) => pad.top + (1 - (v - lo) / Math.max(hi - lo, 1)) * (H - pad.top - pad.bottom);
    const ticks = [lo, Math.round((lo + hi) / 2), hi];

    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.bpm).toFixed(1)}`).join(' ');
    const area = `${line} L${x(points.length - 1).toFixed(1)},${H - pad.bottom} L${x(0).toFixed(1)},${H - pad.bottom} Z`;

    const summary = `${t('tempo_over_time')}: ${values[0]} → ${values[values.length - 1]} ${t('bpm')}${target ? `, ${t('target')} ${target}` : ''}`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
            <defs>
                <linearGradient id="tempo-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
            </defs>

            {ticks.map((v) => (
                <g key={v}>
                    <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
                    <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize={11} className="fill-muted-foreground">
                        {v}
                    </text>
                </g>
            ))}

            {target && (
                <g>
                    <line x1={pad.left} x2={W - pad.right} y1={y(target)} y2={y(target)} className="stroke-brass" strokeWidth={1.5} strokeDasharray="5 5" />
                    <text x={W - pad.right} y={y(target) - 6} textAnchor="end" fontSize={11} fontWeight={600} className="fill-brass-ink">
                        {t('target')} ♩{target}
                    </text>
                </g>
            )}

            {points.length > 1 && <path d={area} fill="url(#tempo-fill)" />}
            {points.length > 1 && <path d={line} fill="none" className="stroke-primary" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}

            {points.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p.bpm)} r={i === points.length - 1 ? 5 : 3.5} className="fill-primary stroke-card" strokeWidth={2}>
                    <title>{`${fmt.format(new Date(p.date))}: ♩ = ${p.bpm}`}</title>
                </circle>
            ))}

            <text x={pad.left} y={H - 8} fontSize={11} className="fill-muted-foreground">
                {fmt.format(new Date(points[0].date))}
            </text>
            {points.length > 1 && (
                <text x={W - pad.right} y={H - 8} textAnchor="end" fontSize={11} className="fill-muted-foreground">
                    {fmt.format(new Date(points[points.length - 1].date))}
                </text>
            )}
        </svg>
    );
}
