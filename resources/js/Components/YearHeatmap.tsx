import { intlLocale, useTrans } from '@/lib/i18n';

/**
 * 53 weeks × 7 days of practice, darker = longer. Days at or above the daily
 * goal reach the full cobalt; the scale is relative to the goal, not the max,
 * so one marathon session doesn't wash out every normal day.
 */
export default function YearHeatmap({ data, goal, today }: { data: Record<string, number>; goal: number; today: string }) {
    const { t, list, locale } = useTrans();
    const monthFmt = new Intl.DateTimeFormat(intlLocale(locale), { month: 'short' });
    const dayFmt = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' });

    const end = parse(today);
    const start = new Date(end);
    start.setDate(end.getDate() - ((end.getDay() + 6) % 7) - 52 * 7); // Monday, 52 weeks back

    const cell = 12;
    const gap = 3;
    const left = 26;
    const top = 18;
    const weeks: { date: Date; minutes: number }[][] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const weekIndex = Math.floor((d.getTime() - start.getTime()) / (7 * 864e5));
        (weeks[weekIndex] ??= []).push({ date: new Date(d), minutes: data[ymd(d)] ?? 0 });
    }

    const level = (m: number) => (m <= 0 ? 0 : m < goal * 0.34 ? 1 : m < goal * 0.67 ? 2 : m < goal ? 3 : 4);
    const fills = ['fill-muted', 'fill-primary/25', 'fill-primary/45', 'fill-primary/70', 'fill-primary'];
    const width = left + weeks.length * (cell + gap);
    const height = top + 7 * (cell + gap);
    const weekdays = list('weekday_short');

    const activeDays = Object.values(data).filter((m) => m > 0).length;

    return (
        <div>
            <div className="overflow-x-auto pb-1">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[680px] w-full" role="img" aria-label={`${t('year_in_practice')}: ${activeDays}`}>
                    {[0, 2, 4].map((row) => (
                        <text key={row} x={0} y={top + row * (cell + gap) + cell - 2} fontSize={9} className="fill-muted-foreground">
                            {weekdays[row]}
                        </text>
                    ))}

                    {weeks.map((week, w) => (
                        <g key={w}>
                            {week[0].date.getDate() <= 7 && (
                                <text x={left + w * (cell + gap)} y={10} fontSize={9} className="fill-muted-foreground">
                                    {monthFmt.format(week[0].date)}
                                </text>
                            )}
                            {week.map((day) => {
                                const row = (day.date.getDay() + 6) % 7;
                                return (
                                    <rect
                                        key={row}
                                        x={left + w * (cell + gap)}
                                        y={top + row * (cell + gap)}
                                        width={cell}
                                        height={cell}
                                        rx={2.5}
                                        className={fills[level(day.minutes)]}
                                    >
                                        <title>{`${dayFmt.format(day.date)}: ${day.minutes ? `${day.minutes} ${t('minutes_short')}` : t('rest_day')}`}</title>
                                    </rect>
                                );
                            })}
                        </g>
                    ))}
                </svg>
            </div>
            <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                {t('less')}
                <svg width={5 * 15} height={12} aria-hidden="true">
                    {fills.map((f, i) => (
                        <rect key={i} x={i * 15} y={0} width={12} height={12} rx={2.5} className={f} />
                    ))}
                </svg>
                {t('more')}
            </div>
        </div>
    );
}

function parse(s: string) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function ymd(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
