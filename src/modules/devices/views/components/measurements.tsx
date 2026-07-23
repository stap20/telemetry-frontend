// cypod-telemetry
// src/modules/devices/views/components/measurements.tsx
import { useTranslation } from 'react-i18next';

import { useFormat } from '@/core/i18n/use-format';
import { Badge, type Tone } from '@/ui/badge';
import { cn } from '@/ui/cn';
import type { DeviceStatus, GeoPosition } from '../../domain/device';

// note: every place a reading is rendered goes through these four components — the fleet table, the
// detail panel, the history rows and the alerts panel. A battery percentage is formatted, coloured
// and given its unit in exactly one place, so the four screens cannot disagree about what 8.5 looks
// like or which digits are shown.

const STATUS_TONE: Record<DeviceStatus, Tone> = {
    OK: 'ok',
    FAULT: 'fault',
    UNKNOWN: 'unknown',
};

// note: `status = null` means the device is registered but has never reported — distinct from
// UNKNOWN, which means it reported and omitted the field. The badge keeps them separate because the
// operator response differs: one is "check the installation", the other is "check the firmware".
export function StatusBadge({ status, pulse }: { status: DeviceStatus | null; pulse?: boolean }) {
    const { t } = useTranslation();

    if (status === null) {
        return <Badge tone="neutral">{t('status.NEVER_REPORTED')}</Badge>;
    }

    return (
        <Badge tone={STATUS_TONE[status]} dot pulse={pulse && status === 'FAULT'}>
            {t(`status.${status}`)}
        </Badge>
    );
}

// note: these thresholds are a READING AID, not the alert rule. The real thresholds live in the
// backend's configuration and are what the alerts panel reflects; duplicating them here would put
// the same number in two systems that can drift, and a bar that turns red at a different level than
// the alert fires would be worse than one that never turns red at all. The bands below are
// deliberately generic "low / getting low / fine" so they read as visual texture rather than as a
// claim about when an alert will be raised.
function batteryTone(level: number): string {
    if (level < 20) return 'bg-status-fault';
    if (level < 40) return 'bg-warn';
    return 'bg-status-ok';
}

export function BatteryValue({ level }: { level: number }) {
    const { t } = useTranslation();
    const format = useFormat();
    const clamped = Math.max(0, Math.min(100, level));

    return (
        <span className="flex items-center gap-2">
            <span
                className="bg-surface-raised h-1.5 w-10 shrink-0 overflow-hidden rounded-full"
                aria-hidden="true"
            >
                {/* note: the bar grows from the inline start, so it fills right-to-left in Arabic
                    without any extra rule — a physical `left: 0` would anchor it on the wrong edge
                    and make a full battery look empty. */}
                <span
                    className={cn('block h-full rounded-full transition-[width] duration-500', batteryTone(clamped))}
                    style={{ width: `${clamped}%` }}
                />
            </span>
            <span className="numeral text-ink text-sm">
                {t('units.percent', { value: format.number(level) })}
            </span>
        </span>
    );
}

export function TemperatureValue({ celsius }: { celsius: number }) {
    const { t } = useTranslation();
    const format = useFormat();

    return (
        <span className="numeral text-ink text-sm">
            {t('units.celsius', { value: format.number(celsius) })}
        </span>
    );
}

export function PositionValue({ position }: { position: GeoPosition | null }) {
    const { t } = useTranslation();
    const format = useFormat();

    if (!position) {
        return <span className="text-faint text-sm">{t('units.noFix')}</span>;
    }

    return (
        <span className="numeral text-muted font-mono text-xs">
            {t('units.coordinates', {
                lat: format.number(position.latitude, 4),
                lng: format.number(position.longitude, 4),
            })}
        </span>
    );
}
