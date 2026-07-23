// cypod-telemetry
// src/core/i18n/formatters.ts
import type { LanguageCode } from './languages';

// note: Arabic is rendered with Latin ("Western Arabic") digits rather than the Arabic-Indic digits
// Intl would choose by default for `ar`. This is a deliberate localisation decision, not an
// oversight: device identifiers, coordinates and threshold values are Latin either way, so the
// default would put two numeral systems in the same table row and make a battery percentage harder
// to compare against the threshold beside it. It also matches how the large majority of Arabic
// software presents technical data.
const INTL_LOCALE: Record<LanguageCode, string> = {
    en: 'en-GB',
    ar: 'ar-u-nu-latn',
};

// note: Intl formatters are expensive to construct and these are called for every cell of a
// polling table. Building them per render showed up as measurable work; caching by locale makes it
// a lookup.
const cache = new Map<string, Intl.DateTimeFormat | Intl.RelativeTimeFormat | Intl.NumberFormat>();

function cached<T>(key: string, build: () => T): T {
    const existing = cache.get(key);
    if (existing) {
        return existing as T;
    }
    const created = build();
    cache.set(key, created as never);
    return created;
}

// note: wraps text in Unicode LEFT-TO-RIGHT ISOLATE / POP DIRECTIONAL ISOLATE. Needed for a
// compound value like the range "1–25" sitting inside an Arabic sentence: the dash between two
// numbers is bidi-neutral, so the algorithm reorders the parts and the range renders visually as
// "25–1" — technically correct reordering, and unreadable, because the digits themselves stay
// left-to-right. Isolating makes the range one atomic left-to-right run.
//
// Done with characters rather than a CSS class because the value is interpolated into the middle of
// a translated string and cannot be wrapped in an element without splitting the sentence — which is
// precisely what a translator must be free to reorder.
export function isolateLtr(text: string): string {
    return `⁦${text}⁩`;
}

export function formatNumber(value: number, language: LanguageCode, fractionDigits = 1): string {
    return cached(`n:${language}:${fractionDigits}`, () =>
        new Intl.NumberFormat(INTL_LOCALE[language], {
            minimumFractionDigits: 0,
            maximumFractionDigits: fractionDigits,
        }),
    ).format(value);
}

export function formatDateTime(value: Date, language: LanguageCode): string {
    return cached(
        `dt:${language}`,
        () =>
            new Intl.DateTimeFormat(INTL_LOCALE[language], {
                dateStyle: 'medium',
                timeStyle: 'medium',
            }),
    ).format(value);
}

export function formatTimeOnly(value: Date, language: LanguageCode): string {
    return cached(
        `t:${language}`,
        () => new Intl.DateTimeFormat(INTL_LOCALE[language], { timeStyle: 'medium' }),
    ).format(value);
}

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

// note: relative time comes from Intl.RelativeTimeFormat instead of translation keys like
// "{{n}} minutes ago". Arabic pluralisation has six categories and the correct forms for minutes,
// hours and days are all different — hand-writing them per unit is a large, easily-wrong catalogue
// that the platform already ships correctly. It also means a third language costs nothing here.
export function formatRelativeTime(value: Date, language: LanguageCode, now = Date.now()): string {
    const seconds = Math.round((value.getTime() - now) / 1000);
    const magnitude = Math.abs(seconds);

    const [amount, unit]: [number, Intl.RelativeTimeFormatUnit] =
        magnitude < MINUTE
            ? [seconds, 'second']
            : magnitude < HOUR
              ? [Math.round(seconds / MINUTE), 'minute']
              : magnitude < DAY
                ? [Math.round(seconds / HOUR), 'hour']
                : [Math.round(seconds / DAY), 'day'];

    return cached(
        `rt:${language}`,
        () => new Intl.RelativeTimeFormat(INTL_LOCALE[language], { numeric: 'auto' }),
    ).format(amount, unit);
}
