// cypod-telemetry
// src/core/query/query-keys.ts
// note: this file imports nothing. `core` may not depend on `modules` — the dependency runs the
// other way — so the page parameter is described structurally rather than by importing the devices
// module's type. It keeps the key registry central without making the platform layer aware of which
// features happen to exist.
export interface PageParams {
    offset: number;
    limit: number;
    // note: filters belong IN the key, not beside it. A page of results is only meaningful together
    // with the range that produced it, so leaving these out would let react-query serve rows from
    // one time window while the controls claim another.
    from?: string;
    to?: string;
}

// note: cache keys live in one place because invalidation depends on them agreeing. A key written
// inline in a hook and a matching key written inline in a mutation's onSuccess look identical in
// review and silently stop matching the moment one of them gains a parameter — the symptom being a
// screen that just never updates. Keys are hierarchical so `devices.all` invalidates every
// device-scoped query, including the per-device ones, in a single call.
export const queryKeys = {
    devices: {
        all: ['devices'] as const,
        list: () => [...queryKeys.devices.all, 'list'] as const,
        latestState: (deviceId: string) =>
            [...queryKeys.devices.all, 'latest', deviceId] as const,
        history: (deviceId: string, page: PageParams) =>
            [...queryKeys.devices.all, 'history', deviceId, page] as const,
    },
    alerts: {
        all: ['alerts'] as const,
        active: () => [...queryKeys.alerts.all, 'active'] as const,
    },
} as const;
