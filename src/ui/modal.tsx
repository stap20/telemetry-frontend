// cypod-telemetry
// src/ui/modal.tsx
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from './cn';

// note: built on the native <dialog> element rather than a div with a high z-index. showModal()
// gives the top layer, the backdrop, focus containment and Escape-to-close from the platform — all
// of which a hand-rolled overlay has to reimplement, and usually reimplements incompletely. The
// focus trap in particular is the part that gets skipped, and it is the part a keyboard user needs.
export function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}) {
    const { t } = useTranslation();
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) {
            return;
        }
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    return (
        <dialog
            ref={ref}
            // note: `cancel` fires for Escape and `close` for everything else. Both are routed to
            // the same handler so the parent's `open` state cannot drift out of sync with the
            // element's — which is what leaves a dialog that will not reopen.
            onCancel={onClose}
            onClose={onClose}
            className={cn(
                'bg-surface border-line text-ink w-[min(28rem,calc(100vw-2rem))] rounded-card border p-0',
                'backdrop:bg-black/60 backdrop:backdrop-blur-sm',
                'm-auto open:animate-in',
            )}
        >
            <header className="border-line flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-base font-semibold">{title}</h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('common.dismiss')}
                    className="text-muted hover:text-ink hover:bg-surface-hover rounded-lg p-1.5 transition-colors"
                >
                    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
                        <path
                            d="M18 6 6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </header>
            <div className="p-5">{children}</div>
        </dialog>
    );
}
