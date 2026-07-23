// cypod-telemetry
// src/ui/states.tsx
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiErrorMessage } from '@/core/http/use-api-error-message';
import { Button } from './button';
import { cn } from './cn';

// note: loading, empty and failed are the three states every remote view has, and they are grouped
// here because they are one concern, not three. Left to each screen they drift — one shows a
// spinner, another shows nothing, a third shows a raw stack trace — and the interface starts
// feeling unreliable precisely when something has already gone wrong.

export function EmptyState({
    icon,
    title,
    body,
    action,
}: {
    icon?: ReactNode;
    title: string;
    body?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            {icon ? <div className="text-faint mb-3">{icon}</div> : null}
            <p className="text-ink text-sm font-medium">{title}</p>
            {body ? <p className="text-muted mt-1 max-w-sm text-sm">{body}</p> : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
    const { t } = useTranslation();
    const describe = useApiErrorMessage();

    return (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="bg-status-fault-soft text-status-fault mb-3 flex size-10 items-center justify-center rounded-full">
                <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                    <path
                        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <p className="text-ink text-sm font-medium">{t('errors.title')}</p>
            <p className="text-muted mt-1 max-w-sm text-sm">{describe(error)}</p>
            {onRetry ? (
                <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
                    {t('common.retry')}
                </Button>
            ) : null}
        </div>
    );
}

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('bg-surface-raised animate-pulse rounded', className)} aria-hidden="true" />;
}

// note: the skeleton mirrors the real row's column widths so the content does not jump when it
// arrives. A generic grey block would be less work here and more work for the eye every time a page
// loads.
export function SkeletonRows({ rows = 4, columns }: { rows?: number; columns: string[] }) {
    return (
        <div className="divide-line divide-y" aria-busy="true">
            {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-4 px-5 py-4">
                    {columns.map((width, columnIndex) => (
                        <Skeleton key={columnIndex} className={cn('h-4', width)} />
                    ))}
                </div>
            ))}
        </div>
    );
}
