// cypod-telemetry
// src/ui/card.tsx
import type { ReactNode } from 'react';
import { cn } from './cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <section
            className={cn(
                'bg-surface border-line rounded-card overflow-hidden border',
                className,
            )}
        >
            {children}
        </section>
    );
}

export function CardHeader({
    title,
    subtitle,
    actions,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
                <h2 className="text-ink truncate text-base font-semibold">{title}</h2>
                {subtitle ? <p className="text-muted mt-0.5 text-sm">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
    );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn('p-5', className)}>{children}</div>;
}
