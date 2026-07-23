// cypod-telemetry
// src/core/http/interceptors.ts
import { i18next } from '@/core/i18n/i18n';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from '@/core/i18n/languages';
import { httpClient } from './http-client';

// note: the backend localises its own error messages from Accept-Language, so the frontend's chosen
// language has to travel with every request. Attaching it in an interceptor — rather than in each
// repository — is what makes it impossible to have one endpoint that answers in English while the
// rest of the interface is in Arabic. It is read at request time, not at install time, so switching
// language takes effect on the very next call without re-registering anything.
export function installLanguageInterceptor(): void {
    httpClient.useRequestInterceptor((request) => {
        const language = isSupportedLanguage(i18next.language)
            ? i18next.language
            : DEFAULT_LANGUAGE;

        return {
            ...request,
            headers: { ...request.headers, 'Accept-Language': language },
        };
    });
}
