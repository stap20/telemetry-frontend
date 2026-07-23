// cypod-telemetry
// src/modules/alerts/services/use-alerts.ts
import { useQuery } from '@tanstack/react-query';

import { env } from '@/core/config/env';
import { queryKeys } from '@/core/query/query-keys';
import { alertRepository } from '../data/alert.repository';

// note: polled on the same interval as the fleet, and mounted in the top bar rather than only on
// the alerts page. A monitoring console whose alert count is only correct on the alerts screen is a
// console that tells an operator everything is fine while a freezer thaws two tabs away.
//
// One query key, so the badge in the header and the panel below it are the same request — mounting
// both does not double the traffic, and they can never show different counts.
export function useActiveAlerts() {
    return useQuery({
        queryKey: queryKeys.alerts.active(),
        queryFn: () => alertRepository.listActive(),
        refetchInterval: env.telemetryPollIntervalMs,
    });
}
