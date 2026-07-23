// cypod-telemetry
// src/modules/devices/services/use-device.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { env } from '@/core/config/env';
import { queryKeys } from '@/core/query/query-keys';
import { deviceRepository } from '../data/device.repository';
import type { DeviceRegistration } from '../domain/device';
import { HISTORY_PAGE_SIZE, type HistoryPageRequest } from '../domain/telemetry-reading';

// note: the roster query lives here, not inline in each caller, because both the fleet table and the
// device detail page need it AND need it configured identically. Two copies of the same useQuery
// with different staleTime values is the classic way one screen starts showing a device the other
// does not.
//
// It is deliberately NOT polled: devices are registered by a person, and the registration mutation
// invalidates this key immediately, so polling would only add traffic to detect a change already
// pushed.
export function useDevices() {
    return useQuery({
        queryKey: queryKeys.devices.list(),
        queryFn: () => deviceRepository.list(),
        staleTime: 5 * 60_000,
    });
}

// note: the SAME query key the fleet list writes. Opening a device from the list therefore renders
// its current state immediately from cache and starts polling from there, instead of showing a
// spinner for data the previous screen already had. Reusing keys across views only works because
// they live in one registry — this is the payoff for that file existing.
export function useLatestState(deviceId: string) {
    return useQuery({
        queryKey: queryKeys.devices.latestState(deviceId),
        queryFn: () => deviceRepository.findLatestState(deviceId),
        refetchInterval: env.telemetryPollIntervalMs,
    });
}

// note: `enabled` is exposed because the caller can know the request is invalid before it is sent —
// a range whose end precedes its start. The endpoint does reject it (400), but firing a request we
// already know is malformed only to render its error is a round trip spent to learn nothing.
export function useDeviceHistory(
    deviceId: string,
    page: HistoryPageRequest,
    options: { enabled?: boolean } = {},
) {
    return useQuery({
        queryKey: queryKeys.devices.history(deviceId, page),
        queryFn: () => deviceRepository.history(deviceId, page),
        enabled: options.enabled ?? true,
        // note: keeps the previous page on screen while the next one loads, so paging does not
        // collapse the table to a skeleton and shift the layout under the cursor between clicks.
        // It covers the date filter too — narrowing a range redraws the rows in place rather than
        // flashing the whole panel back to a skeleton on every keystroke in the date input.
        placeholderData: keepPreviousData,
    });
}

export function useRegisterDevice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (registration: DeviceRegistration) => deviceRepository.register(registration),
        // note: invalidating the branch, not the exact key. `devices.all` is the prefix of every
        // device-scoped key, so the new device appears in the list and immediately gets a state
        // query of its own — without this file needing to know which other views are mounted.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
    });
}

export { HISTORY_PAGE_SIZE };
