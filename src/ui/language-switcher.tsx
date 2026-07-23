// cypod-telemetry
// src/ui/language-switcher.tsx
import { useTranslation } from 'react-i18next';
import { LANGUAGE_LIST, type LanguageCode } from '@/core/i18n/languages';
import { cn } from './cn';

// note: a segmented control rather than a dropdown. There are two languages, and each option shows
// its own name in its own script — a user who cannot read the current interface language can still
// find "العربية" or "English" without opening anything. A <select> would hide both behind a label
// written in the language they may not read.
export function LanguageSwitcher({ className }: { className?: string }) {
    const { i18n, t } = useTranslation();

    return (
        <div
            role="group"
            aria-label={t('language.change')}
            className={cn('bg-surface-raised border-line flex rounded-lg border p-0.5', className)}
        >
            {LANGUAGE_LIST.map((language) => {
                const active = i18n.language === language.code;

                return (
                    <button
                        key={language.code}
                        type="button"
                        lang={language.code}
                        aria-pressed={active}
                        onClick={() => void i18n.changeLanguage(language.code as LanguageCode)}
                        className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                            active
                                ? 'bg-brand-soft text-brand'
                                : 'text-muted hover:text-ink hover:bg-surface-hover',
                        )}
                    >
                        {language.label}
                    </button>
                );
            })}
        </div>
    );
}
