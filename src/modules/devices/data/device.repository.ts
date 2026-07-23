// cypod-telemetry
// src/modules/devices/data/device.repository.ts
import { httpClient } from '@/core/http/http-client';
import { endpoints } from '@/core/http/endpoints';
import { isApiError } from '@/core/http/api-error';
import type { Device, DeviceRegistration, LatestDeviceState } from '../domain/device';
import type { HistoryPageRequest, Page, TelemetryReading } from '../domain/telemetry-reading';
import type {
    DeviceDto,
    DeviceHistoryDto,
    LatestDeviceStateDto,
} from './device.dto';
import { deviceMapper } from './device.mapper';

const CACHE_STATUS_HEADER = 'X-Cache-Status';

export const deviceRepository = {
    async list(): Promise<Device[]> {
        const { data } = await httpClient.get<DeviceDto[]>(endpoints.devices.list);
        return data.map(deviceMapper.toDevice);
    },

    // note: returns null instead of throwing when the device has never reported. The backend
    // answers 404 for that case (LatestStateUnavailableError) using the same status it uses for
    // "no such device", so HTTP cannot separate them — but a registered device with no readings yet
    // is an ordinary state of the world, not a failure, and every caller would otherwise have to
    // unwrap a 404 into "empty" by hand.
    //
    // The ambiguity is resolved by CONTEXT rather than by matching on the error message, which is
    // localised and would break the moment the interface is used in Arabic: the fleet view only
    // asks about devices the list endpoint just returned as the user's own, and the detail view
    // confirms the device is in that list before it interprets a null here.
    async findLatestState(deviceId: string): Promise<LatestDeviceState | null> {
        try {
            const { data, headers } = await httpClient.get<LatestDeviceStateDto>(
                endpoints.devices.latestState(deviceId),
            );

            return deviceMapper.toLatestState(
                data,
                headers.get(CACHE_STATUS_HEADER) === 'HIT',
            );
        } catch (error) {
            if (isApiError(error) && error.kind === 'notFound') {
                return null;
            }
            throw error;
        }
    },

    async history(
        deviceId: string,
        page: HistoryPageRequest,
    ): Promise<Page<TelemetryReading>> {
        const { data } = await httpClient.get<DeviceHistoryDto>(
            endpoints.devices.history(deviceId),
            {
                // note: `from`/`to` are passed straight through as undefined when unset — the http
                // client drops undefined values, so an unfiltered request sends neither parameter
                // rather than `from=undefined`, which the endpoint would reject as a bad date.
                query: {
                    offset: page.offset,
                    limit: page.limit,
                    from: page.from,
                    to: page.to,
                },
            },
        );
        return deviceMapper.toHistoryPage(data);
    },

    async register(registration: DeviceRegistration): Promise<Device> {
        const { data } = await httpClient.post<DeviceDto>(
            endpoints.devices.register,
            deviceMapper.toRegisterRequest(registration),
        );
        return deviceMapper.toDevice(data);
    },
};
