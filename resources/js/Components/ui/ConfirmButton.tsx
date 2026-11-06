import { ReactNode, useState } from 'react';
import { useTrans } from '@/lib/i18n';
import Button from './Button';
import Sheet from './Sheet';

/** A destructive action that asks once, in plain words, before running. */
export default function ConfirmButton({
    trigger,
    title,
    body,
    confirmLabel,
    onConfirm,
}: {
    trigger: (open: () => void) => ReactNode;
    title: ReactNode;
    body?: ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
}) {
    const { t } = useTrans();
    const [open, setOpen] = useState(false);

    return (
        <>
            {trigger(() => setOpen(true))}
            <Sheet
                open={open}
                onClose={() => setOpen(false)}
                title={title}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                setOpen(false);
                                onConfirm();
                            }}
                        >
                            {confirmLabel}
                        </Button>
                    </>
                }
            >
                {body && <p className="text-muted-foreground">{body}</p>}
            </Sheet>
        </>
    );
}
