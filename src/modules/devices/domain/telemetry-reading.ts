// cypod-telemetry
// src/modules/devices/domain/telemetry-reading.ts
import type { Measurements } from './device';

export interface TelemetryReading extends Measurements {
    id: string;
    deviceId: string;
}

export interface HistoryPageRequest {
    offset: number;
    limit: number;
}

// note: a generic page shape rather than a DeviceHistoryPage. Alerts and any future list will want
// the same four fields, and `total`/`offset`/`limit` mean the same thing regardless of what is
// being paged.
export interface Page<T> {
    items: T[];
    total: number;
    offset: number;
    limit: number;
}

// note: the backend caps `limit` at 100 and defaults to 20. The frontend picks a page size inside
// that ceiling rather than near it — a history list is scanned, not read exhaustively, and 25 rows
// is roughly a screen.
export const HISTORY_PAGE_SIZE = 25;
