/**
 * A sample-accurate metronome on the Web Audio clock.
 *
 * setInterval drifts by tens of milliseconds, which musicians hear. Instead a
 * short timer looks ~100ms ahead and schedules clicks on the audio clock
 * ("A Tale of Two Clocks", Chris Wilson).
 */
export class Metronome {
    bpm = 80;
    beatsPerBar = 4;
    muted = false;
    onBeat: ((beat: number) => void) | null = null;

    private ctx: AudioContext | null = null;
    private timer: number | null = null;
    private nextTime = 0;
    private beat = 0;
    private readonly lookahead = 25; // ms between scheduler runs
    private readonly scheduleAhead = 0.1; // seconds of audio scheduled in advance

    get running() {
        return this.timer !== null;
    }

    start() {
        if (this.running) return;

        this.ctx ??= new AudioContext();
        void this.ctx.resume();
        this.beat = 0;
        this.nextTime = this.ctx.currentTime + 0.06;
        this.timer = window.setInterval(() => this.schedule(), this.lookahead);
    }

    stop() {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }

    dispose() {
        this.stop();
        void this.ctx?.close();
        this.ctx = null;
    }

    private schedule() {
        const ctx = this.ctx!;

        while (this.nextTime < ctx.currentTime + this.scheduleAhead) {
            const beat = this.beat;
            this.click(this.nextTime, beat === 0);

            // Fire the visual beat when the sound actually plays.
            const delay = Math.max(0, (this.nextTime - ctx.currentTime) * 1000);
            window.setTimeout(() => this.onBeat?.(beat), delay);

            this.nextTime += 60 / this.bpm;
            this.beat = (this.beat + 1) % this.beatsPerBar;
        }
    }

    private click(time: number, accent: boolean) {
        if (this.muted) return;

        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.value = accent ? 1568 : 1046; // G6 on the downbeat, C6 otherwise
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.55, time + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

        osc.connect(gain).connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.06);
    }
}

/** Average the last few taps into a BPM; resets after a 2s pause. */
export function createTapTempo() {
    let taps: number[] = [];

    return (): number | null => {
        const now = performance.now();

        if (taps.length && now - taps[taps.length - 1] > 2000) {
            taps = [];
        }

        taps.push(now);
        taps = taps.slice(-5);

        if (taps.length < 2) return null;

        const intervals = taps.slice(1).map((t, i) => t - taps[i]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        return Math.round(Math.min(300, Math.max(30, 60000 / avg)));
    };
}
