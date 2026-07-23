// cypod-telemetry
// src/core/i18n/i18next.d.ts
import type en from './locales/en.json';

// note: this makes t() key-checked at compile time against the English catalogue. A renamed or
// deleted key becomes a build failure rather than the literal string "devices.coloumns.status"
// appearing in the interface — which is exactly the class of bug that survives review, because
// nobody re-reads every screen after a rename. English is the reference catalogue; Arabic is
// checked against it by the locale test.
declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation';
        resources: {
            translation: typeof en;
        };
    }
}
