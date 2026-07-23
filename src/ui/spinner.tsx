// cypod-telemetry
// src/ui/spinner.tsx
import { cn } from './cn';

// note: a border-based spinner rather than an SVG so it inherits currentColor and needs no fill
// prop at each call site. `animate-spin` rotates clockwise in both directions — a spinner is not a
// directional affordance, so it is deliberately left unflipped in RTL.
export function Spinner({ className }: { className?: string }) {
    return (
        <span
            role="status"
            aria-live="polite"
            className={cn(
                'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70',
                className,
            )}
        />
    );
}
