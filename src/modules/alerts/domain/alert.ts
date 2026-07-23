// cypod-telemetry
// src/modules/alerts/domain/alert.ts

// note: the two rules the backend evaluates on every reading. UNKNOWN is the landing spot for a
// third rule added server-side before this app knows about it — the alert still lists, with its
// device, value and threshold intact, rather than disappearing from a panel whose entire job is to
// show what needs attention. Silently dropping an alert type is the worst possible failure for this
// screen.
export const ALERT_TYPES = ['LOW_BATTERY', 'HIGH_TEMPERATURE'] as const;
export type KnownAlertType = (typeof ALERT_TYPES)[number];
export type AlertType = KnownAlertType | 'UNKNOWN';

export interface ActiveAlert {
    id: string;
    deviceId: string;
    deviceName: string;
    type: AlertType;
    value: number;
    threshold: number;
    triggeredAt: Date;
}
