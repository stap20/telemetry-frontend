// cypod-telemetry
// src/modules/alerts/data/alert.mapper.ts
import { ALERT_TYPES, type ActiveAlert, type AlertType } from '../domain/alert';
import type { ActiveAlertDto } from './alert.dto';

function toType(value: string): AlertType {
    return ALERT_TYPES.includes(value as never) ? (value as AlertType) : 'UNKNOWN';
}

export const alertMapper = {
    // note: `message` is DROPPED, and this is the most deliberate decision in the module.
    //
    // The backend sends a finished sentence localised from the Accept-Language header we attach to
    // each request. Rendering it would mean the text on screen belongs to whichever language was
    // active when the response was cached — switch to Arabic and the alert list keeps its English
    // prose until the poll happens to refetch, which is a visibly half-translated screen. Fixing
    // that by putting the language in the query key would throw away and refetch the whole list on
    // every language change.
    //
    // Everything needed to say the same thing is already here as structured data: which rule fired,
    // the value that broke it, and the limit it broke. The view composes the presentation from
    // those, so switching language is instant and touches no cache at all. Keeping the sentence as
    // well would leave two sources of truth for the same statement, and they would disagree the
    // first time a threshold's wording changed on one side.
    toDomain(dto: ActiveAlertDto): ActiveAlert {
        return {
            id: dto.id,
            deviceId: dto.deviceId,
            deviceName: dto.deviceName,
            type: toType(dto.type),
            value: dto.value,
            threshold: dto.threshold,
            triggeredAt: new Date(dto.triggeredAt),
        };
    },
};
