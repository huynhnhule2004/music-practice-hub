import { HTMLAttributes } from 'react';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            className={'text-sm font-medium text-destructive mt-1 ' + className}
        >
            {message}
        </p>
    ) : null;
}
