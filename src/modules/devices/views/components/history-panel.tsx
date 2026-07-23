// cypod-telemetry
// src/modules/devices/views/components/history-panel.tsx
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormat } from '@/core/i18n/use-format';
import { Button } from '@/ui/button';
import { Card, CardHeader } from '@/ui/card';
import { cn } from '@/ui/cn';
import { EmptyState, ErrorState, SkeletonRows } from '@/ui/states';
import { useDeviceHistory } from '../../services/use-device';
import { HISTORY_PAGE_SIZE, type TelemetryReading } from '../../domain/telemetry-reading';
import { BatteryValue, PositionValue, StatusBadge, TemperatureValue } from './measurements';

const GRID =
    'grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-[minmax(0,12rem)_7rem_8rem_7rem_minmax(0,1fr)] md:gap-y-0 md:items-center';

export function HistoryPanel({ deviceId }: { deviceId: string }) {
    const { t } = useTranslation();
    const format = useFormat();
    const [offset, setOffset] = useState(0);

    const query = useDeviceHistory(deviceId, { offset, limit: HISTORY_PAGE_SIZE });
    const page = query.data;

    const total = page?.total ?? 0;
    const hasPrevious = offset > 0;
    const hasNext = offset + HISTORY_PAGE_SIZE < total;

    return (
        <Card className="mt-5">
            <CardHeader
                title={t('deviceDetail.history.title')}
                subtitle={t('deviceDetail.history.subtitle')}
                actions={
                    total > 0 ? (
                        <span className="text-faint text-xs">
                            {t('common.showingRange', {
                                range: format.range(
                                    offset + 1,
                                    Math.min(offset + HISTORY_PAGE_SIZE, total),
                                ),
                                total: format.number(total, 0),
                            })}
                        </span>
                    ) : null
                }
            />

            {query.isPending ? (
                <SkeletonRows rows={6} columns={['w-32', 'w-16', 'w-20', 'w-14', 'w-28']} />
            ) : query.error ? (
                <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            ) : total === 0 ? (
                <EmptyState
                    title={t('deviceDetail.history.empty.title')}
                    body={t('deviceDetail.history.empty.body')}
                />
            ) : (
                <>
                    <div
                        className={cn(
                            GRID,
                            'text-faint border-line hidden border-b px-5 py-2.5 text-xs font-medium uppercase md:grid',
                        )}
                    >
                        <span>{t('devices.columns.lastReading')}</span>
                        <span>{t('devices.columns.status')}</span>
                        <span>{t('devices.columns.battery')}</span>
                        <span>{t('devices.columns.temperature')}</span>
                        <span>{t('devices.columns.position')}</span>
                    </div>

                    <div
                        className={cn(
                            'divide-line divide-y',
                            // note: the previous page stays mounted while the next one loads
                            // (keepPreviousData), so it is dimmed rather than replaced by a
                            // skeleton — the table keeps its height and the buttons stay under the
                            // cursor instead of jumping.
                            query.isFetching && 'opacity-60 transition-opacity',
                        )}
                    >
                        {page?.items.map((reading) => (
                            <HistoryRow key={reading.id} reading={reading} />
                        ))}
                    </div>

                    {(hasPrevious || hasNext) && (
                        <footer className="border-line flex items-center justify-between border-t px-5 py-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={!hasPrevious}
                                onClick={() => setOffset((current) => Math.max(0, current - HISTORY_PAGE_SIZE))}
                            >
                                {t('common.previous')}
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={!hasNext}
                                onClick={() => setOffset((current) => current + HISTORY_PAGE_SIZE)}
                            >
                                {t('common.next')}
                            </Button>
                        </footer>
                    )}
                </>
            )}
        </Card>
    );
}

function HistoryRow({ reading }: { reading: TelemetryReading }) {
    const { t } = useTranslation();
    const format = useFormat();

    return (
        <div className={cn(GRID, 'px-5 py-3')}>
            <div className="col-span-2 min-w-0 md:col-span-1">
                <span className="text-ink text-sm" title={format.relative(reading.recordedAt)}>
                    {format.dateTime(reading.recordedAt)}
                </span>
            </div>
            <Field label={t('devices.columns.status')}>
                <StatusBadge status={reading.status} />
            </Field>
            <Field label={t('devices.columns.battery')}>
                <BatteryValue level={reading.battery} />
            </Field>
            <Field label={t('devices.columns.temperature')}>
                <TemperatureValue celsius={reading.temperature} />
            </Field>
            <Field label={t('devices.columns.position')}>
                <PositionValue position={reading.position} />
            </Field>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col items-start gap-1 md:block">
            <span className="text-faint text-[11px] font-medium uppercase md:hidden">{label}</span>
            {children}
        </div>
    );
}
