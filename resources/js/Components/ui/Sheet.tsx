import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { useTrans } from '@/lib/i18n';

/**
 * A bottom sheet on phones, a centred dialog on larger screens.
 * Used for quick edits so the user never loses their place.
 */
export default function Sheet({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
}: {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}) {
    const { t } = useTrans();
    const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size];

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-foreground/40 backdrop-blur-[2px]" aria-hidden="true" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel
                    className={`flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-border bg-card text-card-foreground shadow-2xl sm:rounded-2xl ${width}`}
                >
                    <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
                    <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-5">
                        <div>
                            <DialogTitle className="text-lg font-bold tracking-tight">{title}</DialogTitle>
                            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t('close')}
                            className="-mr-2 -mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="overflow-y-auto px-5 pb-5 pt-2 sm:px-6">{children}</div>
                    {footer && (
                        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
                            {footer}
                        </div>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    );
}
