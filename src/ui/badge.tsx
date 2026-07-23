// cypod-telemetry
// src/ui/badge.tsx
import type { ReactNode } from 'react';
import { cn } from './cn';

export type Tone = 'ok' | 'fault' | 'unknown' | 'warn' | 'brand' | 'neutral';

const TONES: Record<Tone, string> = {
    ok: 'bg-status-ok-soft text-status-ok border-status-ok/30',
    fault: 'bg-status-fault-soft text-status-fault border-status-fault/30',
    unknown: 'bg-status-unknown-soft text-status-unknown border-status-unknown/30',
    warn: 'bg-warn-soft text-warn border-warn/30',
    brand: 'bg-brand-soft text-brand border-brand/30',
    neutral: 'bg-surface-raised text-muted border-line',
};

const DOTS: Record<Tone, string> = {
    ok: 'bg-status-ok',
    fault: 'bg-status-fault',
    unknown: 'bg-status-unknown',
    warn: 'bg-warn',
    brand: 'bg-brand',
    neutral: 'bg-faint',
};

// note: the dot exists so status is not carried by colour alone. Roughly one in twelve men cannot
// separate the red and green used for FAULT and OK, and the badge always carries its translated
// label beside the dot for exactly that reason — the colour is reinforcement, never the message.
export function Badge({
    tone = 'neutral',
    dot = false,
    pulse = false,
    children,
    className,
    title,
}: {
    tone?: Tone;
    dot?: boolean;
    pulse?: boolean;
    children: ReactNode;
    className?: string;
    title?: string;
}) {
    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap',
                TONES[tone],
                className,
            )}
        >
            {dot ? (
                <span className="relative flex size-1.5">
                    {pulse ? (
                        <span
                            className={cn(
                                'absolute inline-flex size-full animate-ping rounded-full opacity-75',
                                DOTS[tone],
                            )}
                        />
                    ) : null}
                    <span className={cn('relative inline-flex size-1.5 rounded-full', DOTS[tone])} />
                </span>
            ) : null}
            {children}
        </span>
    );
}
