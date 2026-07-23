// cypod-telemetry
// src/modules/alerts/data/alert.repository.ts
import { httpClient } from '@/core/http/http-client';
import { endpoints } from '@/core/http/endpoints';
import type { ActiveAlert } from '../domain/alert';
import type { ActiveAlertDto } from './alert.dto';
import { alertMapper } from './alert.mapper';

export const alertRepository = {
    async listActive(): Promise<ActiveAlert[]> {
        const { data } = await httpClient.get<ActiveAlertDto[]>(endpoints.alerts.active);
        return data.map(alertMapper.toDomain);
    },
};
