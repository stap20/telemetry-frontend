// cypod-telemetry
// src/core/i18n/languages.ts

// note: direction is a property OF the language, declared once here, rather than a condition tested
// wherever layout happens. The alternative — `lang === 'ar' ? 'rtl' : 'ltr'` sprinkled through
// components — means adding Hebrew or Farsi later is a hunt through the codebase instead of one
// entry in this table.
export const LANGUAGES = {
    en: { code: 'en', dir: 'ltr', label: 'English', shortLabel: 'EN' },
    ar: { code: 'ar', dir: 'rtl', label: 'العربية', shortLabel: 'ع' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;
export type Direction = (typeof LANGUAGES)[LanguageCode]['dir'];

export const LANGUAGE_LIST = Object.values(LANGUAGES);
export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const STORAGE_KEY = 'cypod.language';

export function isSupportedLanguage(value: unknown): value is LanguageCode {
    return typeof value === 'string' && value in LANGUAGES;
}

// note: the <html> element carries both attributes because they answer different questions. `dir`
// flips the layout; `lang` tells the browser which language the text is in, which drives font
// selection, hyphenation and — the reason it matters here — how a screen reader pronounces it. Set
// on documentElement rather than a wrapper div so that portalled content and the scrollbar side
// follow too.
export function applyDocumentLanguage(code: LanguageCode): void {
    const { dir } = LANGUAGES[code];
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', dir);
}
