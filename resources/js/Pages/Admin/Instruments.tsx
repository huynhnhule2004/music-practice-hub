import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import Button, { IconButton } from '@/Components/ui/Button';
import { Field, Input, Select } from '@/Components/ui/Field';
import PageHeader from '@/Components/ui/PageHeader';
import Sheet from '@/Components/ui/Sheet';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTrans } from '@/lib/i18n';
import { instrumentColor } from '@/lib/instrumentColor';
import { PageProps } from '@/types';

type Row = { id: number; name: string; type: string; songs_count: number; users_count: number; practice_sessions_count: number };

export default function Instruments({ instruments, types }: PageProps<{ instruments: Row[]; types: string[] }>) {
    const { t } = useTrans();
    const { errors } = usePage().props as unknown as { errors: Record<string, string> };
    const [editing, setEditing] = useState<Row | 'new' | null>(null);

    return (
        <AdminLayout>
            <Head title={t('admin.instruments')} />
            <PageHeader
                title={t('admin.instruments')}
                actions={
                    <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
                        {t('admin.add_instrument')}
                    </Button>
                }
            />

            {errors.instrument && <p className="mb-4 rounded-lg bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{errors.instrument}</p>}

            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {instruments.map((i) => (
                    <li key={i.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                        <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: instrumentColor(i.id) }} />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold">{i.name}</p>
                            <p className="text-sm text-muted-foreground">{i.type}</p>
                            <dl className="tabular mt-3 flex gap-5 text-sm">
                                <div>
                                    <dt className="text-xs text-muted-foreground">{t('admin.pieces_count')}</dt>
                                    <dd className="font-bold">{i.songs_count}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">{t('admin.players_count')}</dt>
                                    <dd className="font-bold">{i.users_count}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">{t('total_sessions')}</dt>
                                    <dd className="font-bold">{i.practice_sessions_count}</dd>
                                </div>
                            </dl>
                        </div>
                        <div className="-mr-2 -mt-1 flex">
                            <IconButton label={t('edit')} onClick={() => setEditing(i)}>
                                <Pencil className="h-4 w-4" />
                            </IconButton>
                            <IconButton
                                label={t('delete')}
                                className="hover:text-destructive"
                                onClick={() => confirm(t('admin.delete_instrument_confirm')) && router.delete(route('admin.instruments.destroy', i.id), { preserveScroll: true })}
                            >
                                <Trash2 className="h-4 w-4" />
                            </IconButton>
                        </div>
                    </li>
                ))}
            </ul>

            {editing && <InstrumentSheet row={editing === 'new' ? null : editing} types={types} onClose={() => setEditing(null)} />}
        </AdminLayout>
    );
}

function InstrumentSheet({ row, types, onClose }: { row: Row | null; types: string[]; onClose: () => void }) {
    const { t } = useTrans();
    const form = useForm({ name: row?.name ?? '', type: row?.type ?? types[0] });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };
        row ? form.put(route('admin.instruments.update', row.id), opts) : form.post(route('admin.instruments.store'), opts);
    };

    return (
        <Sheet
            open
            onClose={onClose}
            size="sm"
            title={row ? t('edit') : t('admin.add_instrument')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="instrument-form" disabled={form.processing}>
                        {t('save')}
                    </Button>
                </>
            }
        >
            <form id="instrument-form" onSubmit={submit} className="space-y-5">
                <Field label={t('admin.name')} error={form.errors.name}>
                    {(id, d) => <Input id={id} aria-describedby={d} autoFocus value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />}
                </Field>
                <Field label={t('admin.type')} error={form.errors.type}>
                    {(id) => (
                        <Select id={id} value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}>
                            {types.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
            </form>
        </Sheet>
    );
}
