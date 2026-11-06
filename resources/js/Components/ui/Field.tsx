import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';
import { useTrans } from '@/lib/i18n';

export const controlClass =
    'block w-full rounded-lg border border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-60 sm:text-sm';

type FieldProps = {
    label: ReactNode;
    error?: string;
    hint?: ReactNode;
    optional?: boolean;
    className?: string;
    children: (id: string, describedBy?: string) => ReactNode;
};

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, error, hint, optional, className = '', children }: FieldProps) {
    const id = useId();
    const { t } = useTrans();
    const messageId = error || hint ? `${id}-msg` : undefined;

    return (
        <div className={`space-y-1.5 ${className}`}>
            <label htmlFor={id} className="block text-sm font-medium">
                {label}
                {optional && <span className="font-normal text-muted-foreground"> ({t('optional')})</span>}
            </label>
            {children(id, messageId)}
            {error ? (
                <p id={messageId} className="text-sm font-medium text-destructive">
                    {error}
                </p>
            ) : hint ? (
                <p id={messageId} className="text-sm text-muted-foreground">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={`${controlClass} h-11 ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={`${controlClass} h-11 pr-9 ${className}`} {...props}>
            {children}
        </select>
    );
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={`${controlClass} py-2.5 leading-relaxed ${className}`} {...props} />;
}

/** A row of mutually exclusive choices that read better as buttons than a dropdown. */
export function ChoiceChips<T extends string | number>({
    value,
    options,
    onChange,
    label,
    className = '',
}: {
    value: T | null | undefined;
    options: { value: T; label: ReactNode }[];
    onChange: (value: T) => void;
    label: string;
    className?: string;
}) {
    return (
        <div role="radiogroup" aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <button
                        key={String(option.value)}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(option.value)}
                        className={`tabular h-11 min-w-[3rem] rounded-lg border px-3.5 text-sm font-semibold transition-colors ${
                            active ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card hover:bg-muted'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
