// cypod-telemetry
// src/modules/auth/services/session-expiry.ts
import { httpClient } from '@/core/http/http-client';
import { sessionStore } from './session.store';

// note: registered by the composition root at startup. This is the payoff for routing every call
// through one client: expiry is handled once, for every endpoint that exists now or later, instead
// of each screen remembering to check for 401 in its own error branch — and the screens that would
// forget are exactly the ones a user reaches after leaving a tab open overnight.
//
// The guard is `sessionStore.get()`, not a check on the request path. A 401 from the login endpoint
// means "wrong password" and must not be reported as an expired session; when no session is open
// there is nothing to expire, so the two cases separate without parsing URLs.
export function installSessionExpiryHandler(): void {
    httpClient.useErrorInterceptor((error) => {
        if (error.kind === 'unauthorized') {
            sessionStore.expire();
        }
    });
}
