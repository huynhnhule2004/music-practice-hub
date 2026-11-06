// One stable hue per instrument, so the same instrument always reads the same colour.
const HUES = [
    'hsl(230 72% 56%)', // cobalt
    'hsl(6 80% 58%)', // coral
    'hsl(168 70% 38%)', // teal
    'hsl(40 88% 50%)', // amber
    'hsl(266 62% 60%)', // violet
    'hsl(142 50% 42%)', // green
];

export function instrumentColor(instrumentId: number | undefined) {
    return HUES[((instrumentId ?? 1) - 1) % HUES.length];
}
