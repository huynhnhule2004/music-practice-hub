import { usePage } from '@inertiajs/react';

/**
 * Translate keys from lang/{locale}/app.php (and admin.php for admins),
 * shared via HandleInertiaRequests. Placeholders use Laravel's ":name" syntax.
 */
export function useTrans() {
    const { translations, locale } = usePage().props;

    const lookup = (key: string): unknown => {
        if (key.includes('.')) {
            return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], translations);
        }

        return translations?.[key];
    };

    const t = (key: string, replacements: Record<string, string | number> = {}) => {
        const value = lookup(key);
        let line = typeof value === 'string' ? value : key;

        for (const [name, replacement] of Object.entries(replacements)) {
            line = line.replaceAll(`:${name}`, String(replacement));
        }

        return line;
    };

    const list = (key: string): string[] => {
        const value = lookup(key);

        return Array.isArray(value) ? (value as string[]) : [];
    };

    return { t, list, locale: locale ?? 'en' };
}

/** BCP 47 tag for Intl formatting. */
export function intlLocale(locale: string) {
    return locale === 'vi' ? 'vi-VN' : 'en-GB';
}

/** "Today", "Yesterday", "5 days ago", or "Not yet". */
export function useRelativeDay() {
    const { t } = useTrans();

    return (daysSince: number | null) => {
        if (daysSince === null) return t('never');
        if (daysSince <= 0) return t('today').toLowerCase();
        if (daysSince === 1) return t('yesterday').toLowerCase();

        return t('days_ago', { count: daysSince });
    };
}

export function formatMinutes(minutes: number, t: (k: string) => string) {
    if (minutes < 60) return `${minutes} ${t('minutes_short')}`;

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return m ? `${h} ${t('hours_short')} ${m}` : `${h} ${t('hours_short')}`;
}
