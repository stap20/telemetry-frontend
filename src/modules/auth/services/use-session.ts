// cypod-telemetry
// src/modules/auth/services/use-session.ts
import { useSyncExternalStore } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore } from './session.store';
import { authRepository } from '../data/auth.repository';
import type { Credentials, Registration } from '../domain/authenticated-user';

// note: the service layer. Views call these hooks and never touch the repository or the store
// directly, so "what happens when a login succeeds" — record the session, drop any cached data from
// the previous user — is decided once here rather than in each screen that can trigger it.

export function useSession() {
    return useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.get);
}

export function useLogin() {
    const startSession = useStartSession();

    return useMutation({
        mutationFn: (credentials: Credentials) => authRepository.login(credentials),
        onSuccess: startSession,
    });
}

export function useRegister() {
    const startSession = useStartSession();

    return useMutation({
        mutationFn: (registration: Registration) => authRepository.register(registration),
        onSuccess: startSession,
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => authRepository.logout(),
        // note: onSettled, not onSuccess. If the logout call fails — the network is down, the cookie
        // has already expired server-side — the user still asked to be signed out, and leaving them
        // signed in because the server could not be reached is the wrong answer to that request.
        onSettled: () => {
            sessionStore.end();
            queryClient.clear();
        },
    });
}

function useStartSession() {
    const queryClient = useQueryClient();

    return (user: Parameters<typeof sessionStore.start>[0]) => {
        // note: clear before starting. Devices and alerts are scoped to the authenticated user by
        // the backend, so cache entries surviving a user switch would briefly show one account the
        // other's fleet — the keys are identical, only the cookie differs.
        queryClient.clear();
        sessionStore.start(user);
    };
}
