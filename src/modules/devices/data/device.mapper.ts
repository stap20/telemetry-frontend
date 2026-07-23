// cypod-telemetry
// src/modules/devices/data/device.mapper.ts
import {
    DEVICE_STATUSES,
    type Device,
    type DeviceRegistration,
    type DeviceStatus,
    type GeoPosition,
    type LatestDeviceState,
} from '../domain/device';
import type { Page, TelemetryReading } from '../domain/telemetry-reading';
import type {
    DeviceDto,
    DeviceHistoryDto,
    LatestDeviceStateDto,
    RegisterDeviceRequestDto,
    TelemetryReadingDto,
} from './device.dto';

// note: the backend types `status` as a plain string on the wire, so nothing stops a firmware
// revision from introducing a fourth value. Narrowing it here — with UNKNOWN as the landing spot
// for anything unrecognised — means that ships as a device showing "Unknown" instead of as a blank
// badge, a missing colour, or a crash in whichever component indexed a lookup table with it.
// Widening at the boundary is the point of having a boundary.
function toStatus(value: string): DeviceStatus {
    return DEVICE_STATUSES.includes(value as DeviceStatus) ? (value as DeviceStatus) : 'UNKNOWN';
}

// note: the pair collapses into one nullable object. The backend guarantees the two are set
// together — it rejects half a fix with a 400 — so treating them as separable above this line would
// model a state the system cannot produce. The defensive `!= null` on both is for the wire, not for
// the contract: a malformed response should render "no fix", not NaN on a map.
function toPosition(lat: number | null, lng: number | null): GeoPosition | null {
    return lat != null && lng != null ? { latitude: lat, longitude: lng } : null;
}

export const deviceMapper = {
    // note: `ownerId` is dropped. Every endpoint is already scoped to the authenticated user by the
    // backend, so the field is always the current user's id and carries no information the UI can
    // act on — keeping it would invite a component to "check" ownership client-side, which is a
    // check that means nothing and reads like it means something.
    toDevice(dto: DeviceDto): Device {
        return { id: dto.id, name: dto.name };
    },

    toLatestState(dto: LatestDeviceStateDto, servedFromCache: boolean): LatestDeviceState {
        return {
            deviceId: dto.deviceId,
            battery: dto.battery,
            temperature: dto.temperature,
            position: toPosition(dto.lat, dto.lng),
            status: toStatus(dto.status),
            recordedAt: new Date(dto.recordedAt),
            servedFromCache,
        };
    },

    toReading(dto: TelemetryReadingDto): TelemetryReading {
        return {
            id: dto.id,
            deviceId: dto.deviceId,
            battery: dto.battery,
            temperature: dto.temperature,
            position: toPosition(dto.lat, dto.lng),
            status: toStatus(dto.status),
            recordedAt: new Date(dto.recordedAt),
        };
    },

    toHistoryPage(dto: DeviceHistoryDto): Page<TelemetryReading> {
        return {
            items: dto.items.map(deviceMapper.toReading),
            total: dto.total,
            offset: dto.offset,
            limit: dto.limit,
        };
    },

    toRegisterRequest(registration: DeviceRegistration): RegisterDeviceRequestDto {
        return { id: registration.id.trim(), name: registration.name.trim() };
    },
};
