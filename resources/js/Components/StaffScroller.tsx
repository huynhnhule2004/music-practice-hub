import { PropsWithChildren, useEffect, useRef } from 'react';

/**
 * Horizontal scroll container for the staff on narrow screens.
 * Starts scrolled to the right so today's beat is visible first.
 */
export default function StaffScroller({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;

        if (el) {
            el.scrollLeft = el.scrollWidth;
        }
    }, []);

    return (
        <div ref={ref} className={`overflow-x-auto sm:overflow-visible ${className}`}>
            {children}
        </div>
    );
}
