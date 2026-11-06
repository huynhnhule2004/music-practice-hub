// One stable hue per instrument, so the same instrument always reads the same colour.
const HUES: [number, number, number][] = [
    [188, 68, 32], // peacock (piano)
    [26, 86, 48], // amber wood (guitar)
    [346, 68, 44], // crimson (violin)
    [142, 46, 36], // leaf (ukulele)
    [222, 48, 46], // slate blue (flute)
    [312, 42, 42], // plum (drums)
    [42, 85, 40], // gold
];

function hue(instrumentId: number | undefined) {
    return HUES[((instrumentId ?? 1) - 1) % HUES.length];
}

export function instrumentColor(instrumentId: number | undefined, alpha = 1) {
    const [h, s, l] = hue(instrumentId);

    return alpha === 1 ? `hsl(${h} ${s}% ${l}%)` : `hsl(${h} ${s}% ${l}% / ${alpha})`;
}
