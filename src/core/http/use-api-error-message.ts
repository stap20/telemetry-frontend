// cypod-telemetry
// src/core/http/use-api-error-message.ts
import { useTranslation } from 'react-i18next';
import { isApiError } from './api-error';

// note: one function decides how any failure becomes a sentence, so no view invents its own phrasing
// for "the network is down". The rule it encodes: prefer what the server said, because the server
// already localised it from our Accept-Language header and it knows the specifics — which threshold,
// which device. Fall back to our own catalogue only when the server said nothing usable, which is
// also the only case a non-HTTP exception can reach here.
export function useApiErrorMessage(): (error: unknown) => string {
    const { t } = useTranslation();

    return (error: unknown): string => {
        if (!isApiError(error)) {
            return t('errors.unknown');
        }

        return error.hasServerMessage
            ? error.message
            : t(error.translationKey as 'errors.unknown');
    };
}
