// cypod-telemetry
// src/modules/devices/views/device-detail.page.tsx
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

import { useFormat } from '@/core/i18n/use-format';
import { Badge } from '@/ui/badge';
import { Card, CardBody, CardHeader } from '@/ui/card';
import { PageHeader } from '@/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '@/ui/states';
import { useDevices, useLatestState } from '../services/use-device';
import { BatteryValue, PositionValue, StatusBadge, TemperatureValue } from './components/measurements';

export function DeviceDetailPage({ deviceId }: { deviceId: string }) {
    const { t } = useTranslation();
    const devicesQuery = useDevices();
    const latestQuery = useLatestState(deviceId);

    // note: the roster is the authority on whether this device is ours, which is what makes a null
    // latest state unambiguous. The backend answers 404 both for "no such device" and for
    // "registered but has never reported", with the same status and no distinguishing code — so
    // rather than matching on a localised message, the question is settled here: if the device is
    // not in the user's own list, it does not exist as far as this user is concerned; if it is,
    // then a null state means it simply has not reported yet.
    const device = devicesQuery.data?.find((candidate) => candidate.id === deviceId);

    if (devicesQuery.isPending) {
        return <Skeleton className="h-64 w-full" />;
    }

    if (!device) {
        return (
            <Card>
                <EmptyState
                    title={t('deviceDetail.notFound.title')}
                    body={t('deviceDetail.notFound.body')}
                />
            </Card>
        );
    }

    return (
        <>
            <Link
                to="/"
                className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
            >
                {/* note: the chevron mirrors with the layout. "Back" points at the inline start,
                    which is the left in English and the right in Arabic — an unflipped arrow would
                    point forward in RTL and read as "next". */}
                <svg viewBox="0 0 24 24" fill="none" className="size-4 rtl:-scale-x-100" aria-hidden="true">
                    <path
                        d="M15 18l-6-6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                {t('deviceDetail.backToFleet')}
            </Link>

            <PageHeader
                title={device.name}
                subtitle={
                    <span dir="ltr" className="font-mono text-xs">
                        {device.id}
                    </span>
                }
            />

            <LatestStatePanel query={latestQuery} />
        </>
    );
}

function LatestStatePanel({ query }: { query: ReturnType<typeof useLatestState> }) {
    const { t } = useTranslation();
    const format = useFormat();

    const latest = query.data;

    return (
        <Card>
            <CardHeader
                title={t('deviceDetail.latest.title')}
                subtitle={
                    latest
                        ? t('deviceDetail.latest.recordedAt', {
                              when: format.relative(latest.recordedAt),
                          })
                        : undefined
                }
                actions={
                    latest ? (
                        // note: surfaced because the backend goes to the trouble of reporting it in
                        // a header, and because it is the only way to see the cache working from
                        // the outside. HIT after a page refresh, MISS right after a new reading
                        // invalidates the entry — the behaviour is visible rather than asserted.
                        <Badge
                            tone={latest.servedFromCache ? 'brand' : 'neutral'}
                            title={t('deviceDetail.latest.cacheExplainer')}
                        >
                            {latest.servedFromCache
                                ? t('deviceDetail.latest.cacheHit')
                                : t('deviceDetail.latest.cacheMiss')}
                        </Badge>
                    ) : null
                }
            />

            {query.isPending ? (
                <CardBody>
                    <Skeleton className="h-20 w-full" />
                </CardBody>
            ) : query.error ? (
                <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            ) : !latest ? (
                <EmptyState
                    title={t('devices.neverReported')}
                    body={t('devices.neverReportedHint')}
                />
            ) : (
                <CardBody className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                    <Metric label={t('devices.columns.status')}>
                        <StatusBadge status={latest.status} pulse />
                    </Metric>
                    <Metric label={t('devices.columns.battery')}>
                        <BatteryValue level={latest.battery} />
                    </Metric>
                    <Metric label={t('devices.columns.temperature')}>
                        <TemperatureValue celsius={latest.temperature} />
                    </Metric>
                    <Metric label={t('devices.columns.position')}>
                        <PositionValue position={latest.position} />
                    </Metric>

                    <div className="col-span-2 sm:col-span-4">
                        <p className="text-faint text-xs">
                            {t('devices.columns.lastReading')} ·{' '}
                            <span className="numeral">{format.dateTime(latest.recordedAt)}</span>
                        </p>
                    </div>
                </CardBody>
            )}
        </Card>
    );
}

// note: items-start matters. A flex column stretches its children to the full column width by
// default, which turns an inline badge into a full-width bar — visible on the status cell, where
// the pill stretched right across the column.
function Metric({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col items-start gap-1.5">
            <span className="text-faint text-[11px] font-medium uppercase">{label}</span>
            {children}
        </div>
    );
}
