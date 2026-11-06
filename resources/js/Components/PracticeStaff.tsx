import { intlLocale, useTrans } from '@/lib/i18n';
import { PracticeDay } from '@/types';

/**
 * Four weeks of practice drawn as four bars of 7/4 on a five-line staff.
 *
 * - each day is one beat
 * - pitch = minutes practised (higher note, longer session)
 * - filled notehead = daily goal reached, hollow = practised but short of it
 * - rest = no practice that day
 * - dashed brass line = the daily goal
 */

const LINE_GAP = 14;
const STAFF_TOP = 44;
const STAFF_BOTTOM = STAFF_TOP + LINE_GAP * 4;
const PITCH_LOW = STAFF_BOTTOM + 10; // a sliver of practice sits just under the staff
const PITCH_HIGH = STAFF_TOP - 16; // the longest session in view sits above it
const CLEF_WIDTH = 46;
const BEAT = 30;
const BAR_PADDING = 14;
const STEM = 34;

type Props = {
    days: PracticeDay[];
    goal: number;
    animate?: boolean;
    className?: string;
};

export default function PracticeStaff({ days, goal, animate = false, className = '' }: Props) {
    const { t, locale } = useTrans();
    const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' });
    const longDate = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', day: 'numeric', month: 'long' });

    const bars = chunk(days, 7);
    const barWidth = BAR_PADDING * 2 + BEAT * 7;
    const width = CLEF_WIDTH + bars.length * barWidth + 6;
    const height = STAFF_BOTTOM + 44;

    const ceiling = Math.max(goal * 2, ...days.map((d) => d.minutes), 1);
    const pitch = (minutes: number) => PITCH_LOW - (Math.min(minutes, ceiling) / ceiling) * (PITCH_LOW - PITCH_HIGH);
    const goalY = pitch(goal);
    const lastIndex = days.length - 1;

    const practised = days.filter((d) => d.minutes > 0).length;
    const summary = `${practised}/${days.length} · ${t('daily_goal')}: ${goal} ${t('minutes_short')}`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`h-auto w-full ${animate ? 'staff-animate' : ''} ${className}`}
            role="img"
            aria-label={summary}
        >
            {/* Staff lines */}
            {[0, 1, 2, 3, 4].map((i) => (
                <line
                    key={i}
                    x1={0}
                    x2={width - 6}
                    y1={STAFF_TOP + i * LINE_GAP}
                    y2={STAFF_TOP + i * LINE_GAP}
                    className="stroke-staff"
                    strokeWidth={1}
                />
            ))}

            {/* Time signature: seven beats a bar, one per day of the week */}
            <g className="fill-foreground" fontWeight={700} fontSize={26} textAnchor="middle">
                <text x={20} y={STAFF_TOP + LINE_GAP * 2 - 3}>7</text>
                <text x={20} y={STAFF_BOTTOM - 3}>4</text>
            </g>

            {/* Goal line */}
            <line
                x1={CLEF_WIDTH - 6}
                x2={width - 6}
                y1={goalY}
                y2={goalY}
                className="stroke-brass"
                strokeWidth={1.5}
                strokeDasharray="5 5"
            />

            {bars.map((bar, barIndex) => {
                const barX = CLEF_WIDTH + barIndex * barWidth;

                return (
                    <g key={barIndex}>
                        {/* Bar start date */}
                        <text
                            x={barX + BAR_PADDING}
                            y={height - 8}
                            fontSize={11}
                            className="fill-muted-foreground"
                        >
                            {dateFormat.format(parseDate(bar[0].date))}
                        </text>

                        {bar.map((day, beat) => {
                            const index = barIndex * 7 + beat;
                            const x = barX + BAR_PADDING + beat * BEAT + BEAT / 2;
                            const isToday = index === lastIndex;
                            const label = `${longDate.format(parseDate(day.date))}: ${
                                day.minutes > 0 ? `${day.minutes} ${t('minutes_short')}` : t('rest_day')
                            }`;

                            return (
                                <g
                                    key={day.date}
                                    className={`staff-note ${isToday ? 'text-brass' : 'text-foreground'}`}
                                    style={animate ? { animationDelay: `${index * 28}ms` } : undefined}
                                >
                                    <title>{label}</title>
                                    {day.minutes > 0 ? (
                                        <Note x={x} y={pitch(day.minutes)} filled={day.minutes >= goal} />
                                    ) : (
                                        <Rest x={x} />
                                    )}
                                </g>
                            );
                        })}

                        {/* Bar line, or a final double bar at the end */}
                        {barIndex < bars.length - 1 ? (
                            <line
                                x1={barX + barWidth}
                                x2={barX + barWidth}
                                y1={STAFF_TOP}
                                y2={STAFF_BOTTOM}
                                className="stroke-foreground"
                                strokeWidth={1.25}
                            />
                        ) : (
                            <g className="fill-foreground">
                                <rect x={barX + barWidth - 6} y={STAFF_TOP} width={1.25} height={STAFF_BOTTOM - STAFF_TOP} />
                                <rect x={barX + barWidth - 2} y={STAFF_TOP} width={4} height={STAFF_BOTTOM - STAFF_TOP} />
                            </g>
                        )}
                    </g>
                );
            })}

            {/* "Today" marker under the final beat */}
            <text
                x={CLEF_WIDTH + (bars.length - 1) * barWidth + BAR_PADDING + 6 * BEAT + BEAT / 2}
                y={height - 8}
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
                className="fill-brass-ink"
            >
                {t('today')}
            </text>
        </svg>
    );
}

function Note({ x, y, filled }: { x: number; y: number; filled: boolean }) {
    // Engraving rule: notes on or above the middle line take a stem down on the left.
    const middle = STAFF_TOP + LINE_GAP * 2;
    const stemDown = y <= middle;
    const stemX = stemDown ? x - 5.6 : x + 5.6;

    return (
        <>
            <LedgerLines x={x} y={y} />
            <ellipse
                cx={x}
                cy={y}
                rx={6.4}
                ry={4.6}
                transform={`rotate(-22 ${x} ${y})`}
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={filled ? 0 : 1.8}
            />
            <line
                x1={stemX}
                x2={stemX}
                y1={stemDown ? y + 1 : y - 1}
                y2={stemDown ? y + STEM : y - STEM}
                stroke="currentColor"
                strokeWidth={1.4}
            />
        </>
    );
}

function LedgerLines({ x, y }: { x: number; y: number }) {
    const lines: number[] = [];

    for (let ly = STAFF_TOP - LINE_GAP; ly >= y - 3; ly -= LINE_GAP) {
        lines.push(ly);
    }

    for (let ly = STAFF_BOTTOM + LINE_GAP; ly <= y + 3; ly += LINE_GAP) {
        lines.push(ly);
    }

    return (
        <>
            {lines.map((ly) => (
                <line key={ly} x1={x - 10} x2={x + 10} y1={ly} y2={ly} className="stroke-foreground/60" strokeWidth={1} />
            ))}
        </>
    );
}

function Rest({ x }: { x: number }) {
    // A whole rest hangs from the fourth line, clear of the goal line below it.
    const fourthLine = STAFF_TOP + LINE_GAP;

    return <rect x={x - 6} y={fourthLine} width={12} height={6} fill="currentColor" opacity={0.55} />;
}

function chunk<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];

    for (let i = 0; i < items.length; i += size) {
        out.push(items.slice(i, i + size));
    }

    return out;
}

function parseDate(ymd: string) {
    const [y, m, d] = ymd.split('-').map(Number);

    return new Date(y, m - 1, d);
}
