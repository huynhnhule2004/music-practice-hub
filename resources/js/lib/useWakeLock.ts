import { useEffect } from 'react';

/** Keep the screen on while `active` (phone on a music stand). Silently no-ops where unsupported. */
export function useWakeLock(active: boolean) {
    useEffect(() => {
        if (!active || !('wakeLock' in navigator)) return;

        let lock: WakeLockSentinel | null = null;
        let cancelled = false;

        const acquire = async () => {
            try {
                lock = await navigator.wakeLock.request('screen');
                if (cancelled) await lock.release();
            } catch {
                // Denied (e.g. low battery); the session still works.
            }
        };

        const onVisible = () => {
            if (document.visibilityState === 'visible') void acquire();
        };

        void acquire();
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisible);
            void lock?.release();
        };
    }, [active]);
}
