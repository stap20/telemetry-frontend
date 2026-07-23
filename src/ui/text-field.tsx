// cypod-telemetry
// src/ui/text-field.tsx
import { useId, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
    label: string;
    hint?: string;
    error?: string;
}

export function TextField({ label, hint, error, className, ...rest }: TextFieldProps) {
    const id = useId();
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-muted text-sm font-medium">
                {label}
            </label>
            <input
                id={id}
                // note: aria-invalid and aria-describedby rather than colour alone — the red ring
                // says nothing to a screen reader, and this form is the one place a user can get
                // stuck with no way to find out why.
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={cn(
                    'bg-canvas border-line text-ink placeholder:text-faint h-10 rounded-lg border px-3 text-sm',
                    'transition-colors outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20',
                    error && 'border-status-fault/70 focus:border-status-fault focus:ring-status-fault/20',
                    className,
                )}
                {...rest}
            />
            {error ? (
                <p id={`${id}-error`} className="text-status-fault text-xs">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="text-faint text-xs">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
