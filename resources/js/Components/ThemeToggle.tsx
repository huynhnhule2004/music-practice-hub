import { Monitor, Moon, Sun } from 'lucide-react';
import { useTrans } from '@/lib/i18n';
import Dropdown from './Dropdown';
import { useTheme } from './ThemeProvider';

export const iconButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-card text-foreground transition-colors hover:bg-muted';

const itemClass = (active: boolean) =>
    `flex w-full items-center gap-2 px-4 py-2 text-left text-sm leading-5 transition-colors hover:bg-muted focus:bg-muted focus:outline-none ${
        active ? 'font-semibold text-foreground' : 'text-muted-foreground'
    }`;

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const { t } = useTrans();

    const options = [
        { value: 'light', label: t('theme_light'), Icon: Sun },
        { value: 'dark', label: t('theme_dark'), Icon: Moon },
        { value: 'system', label: t('theme_system'), Icon: Monitor },
    ] as const;

    const CurrentIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button type="button" className={iconButton}>
                    <CurrentIcon className="h-4 w-4" />
                    <span className="sr-only">Theme</span>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right" width="48">
                {options.map(({ value, label, Icon }) => (
                    <button key={value} type="button" className={itemClass(theme === value)} onClick={() => setTheme(value)}>
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </Dropdown.Content>
        </Dropdown>
    );
}
