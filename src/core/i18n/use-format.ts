// cypod-telemetry
// src/core/i18n/use-format.ts
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from './languages';
import {
    formatDateTime,
    formatNumber,
    formatRelativeTime,
    formatTimeOnly,
    isolateLtr,
} from './formatters';

// note: binds the active language to the formatters once, so components call `format.relative(date)`
// instead of threading the current locale through every call. Without this the language becomes an
// argument to hundreds of call sites, and the one place someone forgets it silently renders in
// English inside an otherwise Arabic table.
export function useFormat() {
    const { i18n } = useTranslation();
    const language: LanguageCode = isSupportedLanguage(i18n.language)
        ? i18n.language
        : DEFAULT_LANGUAGE;

    return useMemo(
        () => ({
            language,
            number: (value: number, fractionDigits?: number) =>
                formatNumber(value, language, fractionDigits),
            dateTime: (value: Date) => formatDateTime(value, language),
            time: (value: Date) => formatTimeOnly(value, language),
            relative: (value: Date) => formatRelativeTime(value, language),
            range: (from: number, to: number) =>
                isolateLtr(`${formatNumber(from, language, 0)}–${formatNumber(to, language, 0)}`),
        }),
        [language],
    );
}
