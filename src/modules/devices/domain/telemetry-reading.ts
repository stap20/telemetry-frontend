// cypod-telemetry
// src/modules/devices/domain/telemetry-reading.ts
import type { Measurements } from './device';

export interface TelemetryReading extends Measurements {
    id: string;
    deviceId: string;
}

// note: `from`/`to` are ISO instants, not Date objects, because this value is also a react-query
// cache key. A Date is compared by identity there, so two structurally identical ranges would look
// like different keys and refetch on every render; a string compares by value and is what goes on
// the wire anyway. Both are optional — an absent bound means "unbounded on that side", which is how
// the endpoint reads a missing parameter.
export interface HistoryRange {
    from?: string;
    to?: string;
}

export interface HistoryPageRequest extends HistoryRange {
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
