// cypod-telemetry
// src/core/query/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/core/http/api-error';

const MAX_RETRIES = 2;

// note: the retry rule is written against the normalised error kind, which is the whole reason for
// normalising. Retrying a 404 or a 400 cannot succeed — the request was understood and refused — so
// repeating it only delays the message the user needs by several seconds. A 429 is worse than
// pointless to retry: it is the server asking for less traffic, and retrying answers with more.
// Network and 5xx failures are the only ones where trying again is a real strategy.
function shouldRetry(failureCount: number, error: unknown): boolean {
    if (failureCount >= MAX_RETRIES) {
        return false;
    }
    if (!isApiError(error)) {
        return false;
    }
    return error.kind === 'network' || error.kind === 'server';
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: shouldRetry,
            // note: the fleet view polls every few seconds, so anything shorter than the poll
            // interval would make a remount refetch immediately and double the request rate for no
            // new information.
            staleTime: 4_000,
            refetchOnWindowFocus: true,
            // note: a poll that keeps running in a hidden tab burns the device's rate-limit budget
            // and the user's battery to update a screen nobody is looking at. TanStack pauses
            // interval refetching for backgrounded tabs by default; this states that we rely on it.
            refetchIntervalInBackground: false,
        },
        mutations: {
            retry: false,
        },
    },
});
