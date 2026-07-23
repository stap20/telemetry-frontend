// cypod-telemetry
// src/modules/devices/data/device.dto.ts

// note: the wire shapes. Every timestamp is declared `string`, not `Date` — the backend's DTOs type
// these as Date because that is what the controller returns, but JSON has no date type and what
// actually arrives is an ISO-8601 string. Typing it Date here would be a lie the compiler believes,
// and the failure surfaces far from the cause: `recordedAt.getTime()` throwing "not a function"
// inside a sort comparator. The mapper is where the string becomes a real Date.

export interface DeviceDto {
    id: string;
    name: string;
    ownerId: string;
}

export interface LatestDeviceStateDto {
    deviceId: string;
    battery: number;
    temperature: number;
    lat: number | null;
    lng: number | null;
    status: string;
    recordedAt: string;
}

export interface TelemetryReadingDto {
    id: string;
    deviceId: string;
    battery: number;
    temperature: number;
    lat: number | null;
    lng: number | null;
    status: string;
    recordedAt: string;
}

export interface DeviceHistoryDto {
    items: TelemetryReadingDto[];
    total: number;
    offset: number;
    limit: number;
}

export interface RegisterDeviceRequestDto {
    id: string;
    name: string;
}
