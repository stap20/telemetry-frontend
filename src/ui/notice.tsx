// cypod-telemetry
// src/ui/notice.tsx
import type { ReactNode } from 'react';
import { cn } from './cn';
import type { Tone } from './badge';

const TONES: Partial<Record<Tone, string>> = {
    fault: 'bg-status-fault-soft/60 text-status-fault border-status-fault/30',
    warn: 'bg-warn-soft/60 text-warn border-warn/30',
    brand: 'bg-brand-soft/60 text-brand border-brand/30',
    neutral: 'bg-surface-raised text-muted border-line',
};

// note: role="alert" only for failures. Applying it to every notice would make a screen reader
// interrupt the user to announce reassuring information, which is how assertive live regions end up
// being switched off entirely.
export function Notice({
    tone = 'neutral',
    children,
    className,
}: {
    tone?: Tone;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            role={tone === 'fault' ? 'alert' : 'status'}
            className={cn(
                'rounded-lg border px-3.5 py-2.5 text-sm',
                TONES[tone] ?? TONES.neutral,
                className,
            )}
        >
            {children}
        </div>
    );
}
