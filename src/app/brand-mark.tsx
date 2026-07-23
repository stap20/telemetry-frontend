// cypod-telemetry
// src/app/brand-mark.tsx
import { useTranslation } from 'react-i18next';

// note: the glyph is a signal-strength arc, drawn rather than imported, so the app ships no icon
// dependency and no binary asset for a mark this small. It is aria-hidden because the product name
// sits beside it — announcing both would read the brand twice.
export function BrandMark({ withText = true }: { withText?: boolean }) {
    const { t } = useTranslation();

    return (
        <span className="flex items-center gap-2.5">
            <span className="bg-brand-soft text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
                <svg viewBox="0 0 24 24" fill="none" className="size-4.5" aria-hidden="true">
                    <path
                        d="M4.5 15a7.5 7.5 0 0 1 15 0M8 15a4 4 0 0 1 8 0"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                    />
                    <circle cx="12" cy="15" r="1.6" fill="currentColor" />
                </svg>
            </span>
            {withText ? (
                <span className="flex flex-col leading-tight">
                    <span className="text-ink text-sm font-semibold">{t('app.name')}</span>
                    <span className="text-faint text-[11px]">{t('app.tagline')}</span>
                </span>
            ) : null}
        </span>
    );
}
