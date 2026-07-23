// cypod-telemetry
// src/core/config/env.ts

// note: every environment value is read in this one file and nowhere else. Reading import.meta.env
// inline at each use site is the usual way this rots — a typo'd key silently yields undefined at
// runtime instead of failing, and the set of knobs an operator can turn stops being discoverable.
// Parsing here also means the rest of the app receives real numbers, not strings.

const DEFAULT_POLL_INTERVAL_MS = 5_000;

function readInt(raw: string | undefined, fallback: number): number {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
    // note: relative on purpose. The dev server proxies /api to the backend, so the browser only
    // ever talks to its own origin — which is what makes the httpOnly, sameSite=strict session
    // cookie usable. An absolute API URL here would make every call cross-site and silently drop
    // the cookie the backend just issued.
    apiBaseUrl: '/api/v1',

    telemetryPollIntervalMs: readInt(
        import.meta.env.VITE_TELEMETRY_POLL_INTERVAL_MS,
        DEFAULT_POLL_INTERVAL_MS,
    ),

    isDevelopment: import.meta.env.DEV,
} as const;
