// cypod-telemetry
// src/ui/page-header.tsx
import type { ReactNode } from 'react';

export function PageHeader({
    title,
    subtitle,
    actions,
    meta,
}: {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    meta?: ReactNode;
}) {
    return (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-ink text-xl font-semibold tracking-tight">{title}</h1>
                <div className="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {subtitle}
                    {meta}
                </div>
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
    );
}
