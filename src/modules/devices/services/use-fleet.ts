// cypod-telemetry
// src/modules/devices/services/use-fleet.ts
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import { env } from '@/core/config/env';
import { queryKeys } from '@/core/query/query-keys';
import { deviceRepository } from '../data/device.repository';
import type { Device, FleetDevice } from '../domain/device';
import { useDevices } from './use-device';

const NO_DEVICES: Device[] = [];

// note: THE N+1. The task asks the list to show each device's latest status, and the backend's
// GET /devices returns only id/name/ownerId — there is no endpoint that returns the fleet's states
// in one call. So the view issues one request per device, every poll: five devices at five seconds
// is a request every second, which is fine at this size and is not fine at five hundred.
//
// It is done this way rather than by inventing a client-side batch because the fix belongs on the
// server — a `GET /devices?include=latest` that reads the same Redis keys the per-device endpoint
// already reads would collapse the whole fan-out into one round trip. That is listed as follow-up
// work in the README rather than hidden behind a loop that looks deliberate.
//
// What this shape does buy: each device's state is its own cache entry under its own key, so the
// detail view reuses the exact entry the list already populated and opens with data instead of a
// spinner, and one slow or failing device degrades its own row rather than the whole table.
export function useFleet() {
    const devicesQuery = useDevices();
    const devices = devicesQuery.data ?? NO_DEVICES;

    const stateQueries = useQueries({
        queries: devices.map((device) => ({
            queryKey: queryKeys.devices.latestState(device.id),
            queryFn: () => deviceRepository.findLatestState(device.id),
            refetchInterval: env.telemetryPollIntervalMs,
        })),
    });

    const fleet = useMemo<FleetDevice[]>(
        () =>
            devices.map((device, index) => {
                const state = stateQueries[index];
                return {
                    device,
                    latest: state?.data ?? null,
                    // note: isPending, not isFetching. isFetching is true on every poll, so a row
                    // keyed on it would drop back to a skeleton every five seconds; isPending is
                    // true only until the first answer for that device arrives.
                    isPending: state?.isPending ?? true,
                    error: state?.error ?? null,
                };
            }),
        // note: the dependency is the array of results, and TanStack returns a new array each
        // render, so this memo re-runs often. It is kept for referential stability of the mapped
        // objects between renders where nothing changed, which is what keeps the table rows from
        // re-rendering on every tick of an unrelated device's poll.
        [devices, stateQueries],
    );

    // note: the freshest of the per-device fetches, used for the "updated N seconds ago" line. Zero
    // when nothing has loaded yet, which the view reads as "no timestamp to show".
    const lastUpdatedAt = stateQueries.reduce(
        (latest, query) => Math.max(latest, query.dataUpdatedAt),
        0,
    );

    return {
        fleet,
        devices,
        isPending: devicesQuery.isPending,
        error: devicesQuery.error,
        refetch: devicesQuery.refetch,
        lastUpdatedAt,
    };
}
