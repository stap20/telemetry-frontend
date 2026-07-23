// cypod-telemetry
// src/modules/devices/domain/device.ts

// note: the fleet vocabulary, as the hardware actually speaks it. The backend learned from the
// sample data that devices report OK and FAULT — not ONLINE/OFFLINE/IDLE/ERROR — and UNKNOWN is
// recorded when a reading arrives with no status field at all. The frontend uses the same three
// words rather than translating them into a display vocabulary of its own: a status the device
// reported and a status we inferred must stay distinguishable, and renaming at the boundary is how
// that distinction quietly disappears.
export const DEVICE_STATUSES = ['OK', 'FAULT', 'UNKNOWN'] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export interface Device {
    id: string;
    name: string;
}

// note: ONE object or nothing, where the backend has two independently nullable numbers. A device
// with no GPS fix sends `lat: null, lng: null`, and the backend rejects half a fix outright — so
// "has a position" is a single fact, and modelling it as a single field means no view can be
// written that renders a latitude with a missing longitude. Encoding a rule in a type beats
// remembering it at four call sites.
export interface GeoPosition {
    latitude: number;
    longitude: number;
}

// note: the fields every reading carries, whether it arrived as the cached latest state or as a row
// of history. Declared once so the table cells, the detail panel and the formatters all agree on
// what a reading is.
export interface Measurements {
    battery: number;
    temperature: number;
    position: GeoPosition | null;
    status: DeviceStatus;
    recordedAt: Date;
}

export interface LatestDeviceState extends Measurements {
    deviceId: string;

    // note: lifted out of the X-Cache-Status response header into the domain, because the backend
    // deliberately keeps it OUT of the body — two identical states must serialise identically
    // whether they came from Redis or Postgres. It is presentation-relevant (the detail view shows
    // it) but it describes the response, not the device, which is why it lives here rather than in
    // Measurements.
    servedFromCache: boolean;
}

export interface DeviceRegistration {
    id: string;
    name: string;
}

// note: what the fleet table renders for one row: the device, plus whatever we currently know about
// its state. `latest: null` is a real, expected answer — a registered device that has never
// reported — and is NOT an error, which is the distinction the whole empty-state design rests on.
export interface FleetDevice {
    device: Device;
    latest: LatestDeviceState | null;
    isPending: boolean;
    error: unknown;
}
