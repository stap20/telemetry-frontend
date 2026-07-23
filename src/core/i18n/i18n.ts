// cypod-telemetry
// src/core/i18n/i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ar from './locales/ar.json';
import {
    applyDocumentLanguage,
    DEFAULT_LANGUAGE,
    isSupportedLanguage,
    STORAGE_KEY,
    type LanguageCode,
} from './languages';

function detectInitialLanguage(): LanguageCode {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(stored)) {
        return stored;
    }

    // note: fall back to the browser's own preference before defaulting to English, so an
    // Arabic-speaking user's first visit is already in Arabic rather than requiring them to find a
    // switcher written in a language they did not ask for.
    const browserLanguage = navigator.language.split('-')[0];
    return isSupportedLanguage(browserLanguage) ? browserLanguage : DEFAULT_LANGUAGE;
}

const initialLanguage = detectInitialLanguage();

void i18next.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        ar: { translation: ar },
    },
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    // note: React escapes interpolated values already; leaving i18next's escaping on would
    // double-encode anything containing an apostrophe or quotation mark — visible immediately in
    // "Don't have an account?".
    interpolation: { escapeValue: false },
});

// note: direction is applied here, on the language-change event, rather than in a component effect.
// A component can be unmounted, rendered twice, or simply forgotten by the next person adding a
// route — but every language change goes through i18next, so this is the one place that cannot be
// bypassed. It also fires for the initial language below, so there is a single code path.
i18next.on('languageChanged', (language) => {
    if (isSupportedLanguage(language)) {
        applyDocumentLanguage(language);
        localStorage.setItem(STORAGE_KEY, language);
    }
});

applyDocumentLanguage(initialLanguage);

export { i18next };
