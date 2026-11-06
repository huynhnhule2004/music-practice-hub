import { Link } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { useTrans } from '@/lib/i18n';
import Dropdown from './Dropdown';
import { iconButton } from './ThemeToggle';

const languages = [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' },
] as const;

export function LanguageSwitcher() {
    const { locale } = useTrans();

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button type="button" className={iconButton}>
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">Language</span>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right" width="48">
                {languages.map(({ code, label }) => (
                    <Link
                        key={code}
                        href={route('language.switch', { locale: code })}
                        lang={code}
                        className={`block w-full px-4 py-2 text-left text-sm leading-5 transition-colors hover:bg-muted focus:bg-muted focus:outline-none ${
                            locale === code ? 'font-semibold text-foreground' : 'text-muted-foreground'
                        }`}
                    >
                        {label}
                    </Link>
                ))}
            </Dropdown.Content>
        </Dropdown>
    );
}
