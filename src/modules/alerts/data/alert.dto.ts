// cypod-telemetry
// src/modules/alerts/data/alert.dto.ts

export interface ActiveAlertDto {
    id: string;
    deviceId: string;
    deviceName: string;
    type: string;

    // note: a complete, already-localised sentence — the backend renders it from the request's
    // Accept-Language header. The mapper deliberately drops it; see alert.mapper.ts for why.
    message: string;

    value: number;
    threshold: number;
    triggeredAt: string;
}
