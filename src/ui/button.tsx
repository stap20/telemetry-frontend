// cypod-telemetry
// src/ui/button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Spinner } from './spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
    primary:
        'bg-brand text-canvas hover:bg-brand-strong active:bg-brand-strong font-semibold shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset]',
    secondary: 'bg-surface-raised text-ink border border-line hover:bg-surface-hover hover:border-line-strong',
    ghost: 'text-muted hover:text-ink hover:bg-surface-hover',
    danger: 'bg-status-fault-soft text-status-fault border border-status-fault/40 hover:bg-status-fault/20',
};

const SIZES: Record<Size, string> = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className,
    disabled,
    ...rest
}: ButtonProps) {
    return (
        <button
            // note: `disabled` while loading, so a slow login cannot be submitted three times and
            // create three sessions — the mutation is only idempotent by luck, not by contract.
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center rounded-lg transition-colors duration-150',
                'disabled:pointer-events-none disabled:opacity-50',
                VARIANTS[variant],
                SIZES[size],
                className,
            )}
            {...rest}
        >
            {loading ? <Spinner className="size-4" /> : icon}
            {children}
        </button>
    );
}
