// cypod-telemetry
// src/core/http/endpoints.ts

// note: every backend path in the application, in one file. Paths scattered as string literals
// through repositories are the thing that makes an API rename a scavenger hunt; here a changed route
// is a one-line edit and TypeScript finds the callers. Ids are encoded at the point of construction
// so no caller has to remember to — device ids come from the hardware and are not guaranteed to be
// URL-safe.
const device = (deviceId: string) => `/devices/${encodeURIComponent(deviceId)}`;

export const endpoints = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        logout: '/auth/logout',
    },
    devices: {
        list: '/devices',
        register: '/devices',
        latestState: (deviceId: string) => `${device(deviceId)}/latest`,
        history: (deviceId: string) => `${device(deviceId)}/history`,
        telemetry: (deviceId: string) => `${device(deviceId)}/telemetry`,
    },
    alerts: {
        active: '/alerts',
    },
} as const;
