// cypod-telemetry
// src/modules/auth/services/session.store.ts
import type { AuthenticatedUser } from '../domain/authenticated-user';

const STORAGE_KEY = 'cypod.session';

// note: WHAT IS STORED HERE IS NOT A CREDENTIAL. The credential is the httpOnly cookie the backend
// issues, which JavaScript cannot read and therefore cannot leak. What localStorage holds is the
// display profile — a name and an email — so that a page refresh can render the header and decide
// which route to show without a round trip.
//
// This is the trade the design makes. Because the cookie is invisible to JS, the app cannot ask
// "am I still authenticated?" directly, and the backend exposes no /auth/me endpoint to ask. So the
// profile is treated as a HINT, never as proof: the server remains the only authority, and the
// first 401 from any request clears it. A user who hand-edits localStorage gains a header with
// their name in it and nothing else — every actual request still fails without the cookie.
//
// The alternative — keeping the accessToken from the login response in localStorage — would make
// the check local and honest-looking, and would also put a bearer token somewhere any injected
// script can read it. That is the more common pattern and the weaker one.

let current: AuthenticatedUser | null = readStoredProfile();
let endedByExpiry = false;
const listeners = new Set<() => void>();

function readStoredProfile(): AuthenticatedUser | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AuthenticatedUser) : null;
    } catch {
        // note: corrupt or unparseable storage is treated as "signed out" rather than thrown. A
        // stale entry from an older shape of this object must not be able to break every future
        // load of the application with a white screen.
        return null;
    }
}

function emit(): void {
    for (const listener of listeners) {
        listener();
    }
}

export const sessionStore = {
    // note: getSnapshot for useSyncExternalStore must return a stable reference for unchanged state,
    // or React re-renders forever. `current` is only reassigned on a real transition.
    get: (): AuthenticatedUser | null => current,

    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    start(user: AuthenticatedUser): void {
        current = user;
        endedByExpiry = false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        emit();
    },

    end(): void {
        current = null;
        localStorage.removeItem(STORAGE_KEY);
        emit();
    },

    // note: distinct from end() so the login screen can explain WHY the user is looking at it. Being
    // silently returned to a login form mid-task reads as a bug; "your session has ended" reads as
    // the system working.
    expire(): void {
        if (current === null) {
            return;
        }
        endedByExpiry = true;
        this.end();
    },

    // note: consumed on read, so the notice shows once and does not reappear on every later visit
    // to the login screen.
    consumeExpiryNotice(): boolean {
        const expired = endedByExpiry;
        endedByExpiry = false;
        return expired;
    },
};
