// cypod-telemetry
// src/modules/alerts/views/alerts.page.tsx
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

import { env } from '@/core/config/env';
import { useFormat } from '@/core/i18n/use-format';
import { Badge, type Tone } from '@/ui/badge';
import { Card } from '@/ui/card';
import { LiveIndicator } from '@/ui/live-indicator';
import { PageHeader } from '@/ui/page-header';
import { EmptyState, ErrorState, SkeletonRows } from '@/ui/states';
import { useActiveAlerts } from '../services/use-alerts';
import type { ActiveAlert, AlertType } from '../domain/alert';

const TYPE_TONE: Record<AlertType, Tone> = {
    LOW_BATTERY: 'warn',
    HIGH_TEMPERATURE: 'fault',
    UNKNOWN: 'neutral',
};

// note: which unit a value carries is a property of the rule that produced it — a battery alert is
// a percentage, a temperature alert is degrees. Declared once here so the value and the threshold
// beside it can never be labelled with different units.
const TYPE_UNIT: Record<AlertType, 'units.percent' | 'units.celsius' | null> = {
    LOW_BATTERY: 'units.percent',
    HIGH_TEMPERATURE: 'units.celsius',
    UNKNOWN: null,
};

export function AlertsPage() {
    const { t } = useTranslation();
    const query = useActiveAlerts();
    const alerts = query.data ?? [];

    return (
        <>
            <PageHeader
                title={t('alerts.title')}
                subtitle={t('alerts.subtitle')}
                meta={
                    <LiveIndicator
                        intervalMs={env.telemetryPollIntervalMs}
                        lastUpdatedAt={query.dataUpdatedAt}
                    />
                }
                actions={
                    alerts.length > 0 ? (
                        <Badge tone="fault" dot pulse>
                            {t('alerts.count', { count: alerts.length })}
                        </Badge>
                    ) : null
                }
            />

            {query.isPending ? (
                <Card>
                    <SkeletonRows rows={3} columns={['w-32', 'w-48', 'w-20', 'w-24']} />
                </Card>
            ) : query.error ? (
                <Card>
                    <ErrorState error={query.error} onRetry={() => void query.refetch()} />
                </Card>
            ) : alerts.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<AllClearIcon />}
                        title={t('alerts.empty.title')}
                        body={t('alerts.empty.body')}
                    />
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {alerts.map((alert) => (
                        <AlertCard key={alert.id} alert={alert} />
                    ))}
                </div>
            )}
        </>
    );
}

function AlertCard({ alert }: { alert: ActiveAlert }) {
    const { t } = useTranslation();
    const format = useFormat();

    const unit = TYPE_UNIT[alert.type];
    // note: the value and the limit are shown as separate labelled figures rather than as a
    // sentence. An operator scanning a wall of alerts compares "27.2 against 15" far faster than
    // they read a paragraph, and it is the reason the backend's pre-composed message can be dropped
    // in the mapper without losing anything.
    const show = (value: number) =>
        unit ? t(unit, { value: format.number(value) }) : format.number(value);

    return (
        <Card className="hover:border-line-strong transition-colors">
            <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <Badge tone={TYPE_TONE[alert.type]} dot>
                        {t(`alerts.type.${alert.type === 'UNKNOWN' ? 'unknown' : alert.type}`)}
                    </Badge>
                    <span
                        className="text-faint shrink-0 text-xs"
                        title={format.dateTime(alert.triggeredAt)}
                    >
                        {t('alerts.triggered', { when: format.relative(alert.triggeredAt) })}
                    </span>
                </div>

                <div className="flex items-baseline gap-3">
                    <span className="numeral text-ink text-2xl font-semibold">
                        {show(alert.value)}
                    </span>
                    <span className="text-muted text-xs">
                        {t('alerts.threshold')} <span className="numeral">{show(alert.threshold)}</span>
                    </span>
                </div>

                <Link
                    to="/devices/$deviceId"
                    params={{ deviceId: alert.deviceId }}
                    className="border-line hover:bg-surface-hover -mx-1 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors"
                >
                    <span className="min-w-0">
                        <span className="text-ink block truncate text-sm font-medium">
                            {alert.deviceName}
                        </span>
                        <span dir="ltr" className="text-faint block truncate font-mono text-[11px]">
                            {alert.deviceId}
                        </span>
                    </span>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-faint size-4 shrink-0 rtl:-scale-x-100"
                        aria-hidden="true"
                    >
                        <path
                            d="M9 18l6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Link>
            </div>
        </Card>
    );
}

function AllClearIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="size-9" aria-hidden="true">
            <path
                d="M9 12.5l2.2 2.2L15.5 10M12 3l7.5 3v6c0 4.2-3 7.4-7.5 9-4.5-1.6-7.5-4.8-7.5-9V6L12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
