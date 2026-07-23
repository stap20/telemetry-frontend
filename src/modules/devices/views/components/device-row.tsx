// cypod-telemetry
// src/modules/devices/views/components/device-row.tsx
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

import { useFormat } from '@/core/i18n/use-format';
import { useApiErrorMessage } from '@/core/http/use-api-error-message';
import { Skeleton } from '@/ui/states';
import { cn } from '@/ui/cn';
import type { FleetDevice } from '../../domain/device';
import { BatteryValue, StatusBadge, TemperatureValue } from './measurements';

// note: ONE markup tree for both layouts, not a table for desktop and a card list for mobile. The
// duplicated-markup approach means every future column is added twice and eventually only in one of
// them. Here the row is a grid that reflows: stacked label/value pairs on a phone, aligned columns
// from `md` up, with the labels hidden because the header row provides them.
const GRID =
    'grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-[minmax(0,2fr)_8rem_9rem_7rem_minmax(0,10rem)] md:gap-y-0 md:items-center';

export function FleetTableHeader() {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                GRID,
                'text-faint border-line hidden border-b px-5 py-3 text-xs font-medium uppercase md:grid',
            )}
        >
            <span>{t('devices.columns.device')}</span>
            <span>{t('devices.columns.status')}</span>
            <span>{t('devices.columns.battery')}</span>
            <span>{t('devices.columns.temperature')}</span>
            <span>{t('devices.columns.lastReading')}</span>
        </div>
    );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col items-start gap-1 md:block">
            <span className="text-faint text-[11px] font-medium uppercase md:hidden">{label}</span>
            {children}
        </div>
    );
}

export function DeviceRow({ entry }: { entry: FleetDevice }) {
    const { t } = useTranslation();
    const format = useFormat();
    const describeError = useApiErrorMessage();
    const { device, latest, isPending, error } = entry;

    return (
        <Link
            to="/devices/$deviceId"
            params={{ deviceId: device.id }}
            aria-label={`${t('devices.viewDetail')}: ${device.name}`}
            className={cn(
                GRID,
                'hover:bg-surface-hover group px-5 py-4 transition-colors',
            )}
        >
            <div className="col-span-2 min-w-0 md:col-span-1">
                <p className="text-ink truncate text-sm font-medium">{device.name}</p>
                {/* note: dir="ltr" on the identifier. It is a hardware serial, always Latin, and in
                    an RTL paragraph a bidi-neutral string like "DEV-1004" gets its hyphen and digits
                    reordered into "1004-DEV". */}
                <p dir="ltr" className="text-faint mt-0.5 truncate font-mono text-xs">
                    {device.id}
                </p>
            </div>

            {isPending ? (
                <PendingCells />
            ) : error ? (
                // note: one failing device does not take the table down with it — the row says what
                // went wrong and every other row keeps polling normally.
                <div className="text-status-fault col-span-2 text-xs md:col-span-4">
                    {describeError(error)}
                </div>
            ) : latest === null ? (
                <div className="col-span-2 md:col-span-4">
                    <StatusBadge status={null} />
                    <span className="text-faint ms-2 text-xs">
                        {t('devices.neverReportedHint')}
                    </span>
                </div>
            ) : (
                <>
                    <Cell label={t('devices.columns.status')}>
                        <StatusBadge status={latest.status} pulse />
                    </Cell>
                    <Cell label={t('devices.columns.battery')}>
                        <BatteryValue level={latest.battery} />
                    </Cell>
                    <Cell label={t('devices.columns.temperature')}>
                        <TemperatureValue celsius={latest.temperature} />
                    </Cell>
                    <Cell label={t('devices.columns.lastReading')}>
                        <span
                            className="text-muted text-sm"
                            // note: the exact instant on hover, the human one in the cell. "3
                            // minutes ago" is what an operator scans for; the timestamp is what they
                            // quote in an incident report.
                            title={format.dateTime(latest.recordedAt)}
                        >
                            {format.relative(latest.recordedAt)}
                        </span>
                    </Cell>
                </>
            )}
        </Link>
    );
}

function PendingCells() {
    return (
        <div className="col-span-2 flex items-center gap-4 md:col-span-4">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-24" />
        </div>
    );
}
