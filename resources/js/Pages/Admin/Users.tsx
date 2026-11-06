import { Head, router, usePage } from '@inertiajs/react';
import { Flame, MoreHorizontal, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import Pagination from '@/Components/Pagination';
import Badge from '@/Components/ui/Badge';
import PageHeader from '@/Components/ui/PageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatMinutes, intlLocale, useTrans } from '@/lib/i18n';
import { PageProps, Paginated } from '@/types';

type Row = {
    id: number;
    name: string;
    email: string;
    role: 'member' | 'admin';
    current_streak: number;
    practice_sessions_count: number;
    minutes: number;
    last_session_at: string | null;
    created_at: string;
    suspended_at: string | null;
    onboarded: boolean;
};

type Props = PageProps<{ users: Paginated<Row>; filters: { q?: string; role?: string; state?: string } }>;

export default function Users({ users, filters }: Props) {
    const { t, locale } = useTrans();
    const me = usePage().props.auth.user;
    const [query, setQuery] = useState(filters.q ?? '');
    const first = useRef(true);
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' });

    const visit = (next: Partial<Props['filters']>) =>
        router.get(route('admin.users.index'), { ...filters, ...next } as Record<string, string>, { preserveState: true, replace: true });

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const id = window.setTimeout(() => visit({ q: query || undefined }), 300);
        return () => window.clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const update = (user: Row, data: { role: Row['role'] } | { suspended: boolean }) => router.patch(route('admin.users.update', user.id), data, { preserveScroll: true });

    return (
        <AdminLayout>
            <Head title={t('admin.users')} />
            <PageHeader title={t('admin.users')} />

            <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('admin.search_users')}
                        className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                    />
                </div>
                <select value={filters.role ?? ''} onChange={(e) => visit({ role: e.target.value || undefined })} aria-label={t('admin.role')} className="h-11 rounded-lg border border-input bg-card px-3 pr-8 text-sm">
                    <option value="">{t('admin.role')}: {t('all')}</option>
                    <option value="member">{t('admin.role_member')}</option>
                    <option value="admin">{t('admin.role_admin')}</option>
                </select>
                <select value={filters.state ?? ''} onChange={(e) => visit({ state: e.target.value || undefined })} aria-label={t('admin.state_active')} className="h-11 rounded-lg border border-input bg-card px-3 pr-8 text-sm">
                    <option value="">{t('all')}</option>
                    <option value="active">{t('admin.state_active')}</option>
                    <option value="suspended">{t('admin.state_suspended')}</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                    <thead className="hidden border-b border-border bg-muted/50 text-left text-xs font-semibold text-muted-foreground md:table-header-group">
                        <tr>
                            <th className="px-4 py-2.5">{t('admin.name')}</th>
                            <th className="px-4 py-2.5">{t('admin.role')}</th>
                            <th className="px-4 py-2.5 text-right">{t('total_sessions')}</th>
                            <th className="px-4 py-2.5 text-right">{t('time_spent')}</th>
                            <th className="px-4 py-2.5">{t('admin.last_session')}</th>
                            <th className="px-4 py-2.5">{t('admin.joined')}</th>
                            <th className="px-2 py-2.5" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.data.map((u) => {
                            const isMe = u.id === me.id;
                            return (
                                <tr key={u.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 md:table-row md:p-0 ${u.suspended_at ? 'opacity-60' : ''}`}>
                                    <td className="min-w-0 flex-1 md:px-4 md:py-3">
                                        <p className="font-semibold">
                                            {u.name}
                                            {isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({t('admin.you')})</span>}
                                        </p>
                                        <p className="truncate text-muted-foreground">{u.email}</p>
                                        {!u.onboarded && <p className="text-xs text-muted-foreground">{t('admin.not_onboarded')}</p>}
                                    </td>
                                    <td className="md:px-4 md:py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {u.role === 'admin' ? <Badge tone="primary">{t('admin.role_admin')}</Badge> : <Badge>{t('admin.role_member')}</Badge>}
                                            {u.suspended_at && <Badge tone="coral">{t('admin.state_suspended')}</Badge>}
                                        </div>
                                    </td>
                                    <td className="tabular hidden text-right md:table-cell md:px-4 md:py-3">
                                        {u.practice_sessions_count}
                                        {u.current_streak > 0 && (
                                            <span className="ml-2 inline-flex items-center gap-0.5 text-coral">
                                                <Flame className="h-3.5 w-3.5" />
                                                {u.current_streak}
                                            </span>
                                        )}
                                    </td>
                                    <td className="tabular hidden text-right md:table-cell md:px-4 md:py-3">{formatMinutes(u.minutes, t)}</td>
                                    <td className="hidden text-muted-foreground md:table-cell md:px-4 md:py-3">{u.last_session_at ? fmt.format(new Date(u.last_session_at)) : '–'}</td>
                                    <td className="hidden text-muted-foreground md:table-cell md:px-4 md:py-3">{fmt.format(new Date(u.created_at))}</td>
                                    <td className="ml-auto md:px-2 md:py-3">
                                        {!isMe && (
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button type="button" aria-label={t('menu')} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content width="48">
                                                    <button type="button" className="block w-full px-4 py-2 text-start text-sm hover:bg-muted" onClick={() => update(u, { role: u.role === 'admin' ? 'member' : 'admin' })}>
                                                        {u.role === 'admin' ? t('admin.make_member') : t('admin.make_admin')}
                                                    </button>
                                                    {u.suspended_at ? (
                                                        <button type="button" className="block w-full px-4 py-2 text-start text-sm hover:bg-muted" onClick={() => update(u, { suspended: false })}>
                                                            {t('admin.unsuspend')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="block w-full px-4 py-2 text-start text-sm text-destructive hover:bg-muted"
                                                            onClick={() => confirm(t('admin.suspend_confirm', { name: u.name })) && update(u, { suspended: true })}
                                                        >
                                                            {t('admin.suspend')}
                                                        </button>
                                                    )}
                                                </Dropdown.Content>
                                            </Dropdown>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination page={users} />
        </AdminLayout>
    );
}
