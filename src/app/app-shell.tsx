// cypod-telemetry
// src/app/app-shell.tsx
import type { ReactNode } from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/ui/language-switcher';
import { cn } from '@/ui/cn';
import { useLogout, useSession } from '@/modules/auth/services/use-session';
import { useActiveAlerts } from '@/modules/alerts/services/use-alerts';
import { BrandMark } from './brand-mark';

// note: the chrome around every authenticated route. It renders once and the Outlet swaps beneath
// it, so navigating between the fleet and the alerts panel does not tear down the header — which
// matters more than it sounds, because the polling queries live under this subtree and a remounted
// provider would restart every interval on each navigation.
export function AppShell() {
    return (
        <div className="flex min-h-screen flex-col">
            <TopBar />
            <main className="mx-auto w-full max-w-6xl grow px-4 py-7">
                <Outlet />
            </main>
        </div>
    );
}

function TopBar() {
    const { t } = useTranslation();

    return (
        <header className="border-line bg-surface/85 sticky top-0 z-20 border-b backdrop-blur-md">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
                <Link to="/" className="shrink-0">
                    <BrandMark />
                </Link>

                <nav className="flex items-center gap-1">
                    <NavLink to="/" label={t('nav.fleet')} />
                    <NavLink to="/alerts" label={t('nav.alerts')} badge={<AlertCount />} />
                </nav>

                {/* note: ms-auto, not ml-auto. The logical property pushes the controls to the
                    inline end, which is the right in English and the left in Arabic — a physical
                    margin would strand them on the wrong side of the RTL layout. */}
                <div className="ms-auto flex items-center gap-3">
                    <LanguageSwitcher />
                    <AccountChip />
                </div>
            </div>
        </header>
    );
}

function NavLink({ to, label, badge }: { to: string; label: string; badge?: ReactNode }) {
    return (
        <Link
            to={to}
            // note: `activeOptions.exact` on the fleet route only. Without it "/" is a prefix of
            // every path and both tabs would light up at once on the device detail page.
            activeOptions={{ exact: to === '/' }}
            className="text-muted hover:text-ink hover:bg-surface-hover flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            activeProps={{ className: 'bg-surface-raised !text-ink' }}
        >
            {label}
            {badge}
        </Link>
    );
}

// note: lives in the header, so the count is current on every screen rather than only on the alerts
// page. It shares one query key with the alerts panel, so mounting both does not double the polling
// and the two can never disagree.
function AlertCount() {
    const { data } = useActiveAlerts();
    const count = data?.length ?? 0;

    if (count === 0) {
        return null;
    }

    return (
        <span className="numeral bg-status-fault-soft text-status-fault rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
            {count}
        </span>
    );
}

function AccountChip() {
    const { t } = useTranslation();
    const session = useSession();
    const logout = useLogout();

    if (!session) {
        return null;
    }

    return (
        <div className="flex items-center gap-2.5">
            <span
                aria-hidden="true"
                className="bg-brand-soft text-brand hidden size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:flex"
            >
                {session.initials}
            </span>
            <span className="text-muted hidden text-sm md:inline">{session.displayName}</span>

            <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                title={t('nav.signOut')}
                aria-label={t('nav.signOut')}
                className={cn(
                    'text-muted hover:text-status-fault hover:bg-surface-hover rounded-lg p-2 transition-colors',
                    logout.isPending && 'pointer-events-none opacity-50',
                )}
            >
                {/* note: the arrow points at the inline end, so it flips with the layout via the
                    rtl: variant. A sign-out arrow pointing back into the interface in Arabic would
                    read as "enter", which is the opposite of what the control does. */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-4.5 rtl:-scale-x-100"
                    aria-hidden="true"
                >
                    <path
                        d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </div>
    );
}
