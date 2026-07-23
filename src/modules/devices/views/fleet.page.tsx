// cypod-telemetry
// src/modules/devices/views/fleet.page.tsx
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { env } from '@/core/config/env';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { LiveIndicator } from '@/ui/live-indicator';
import { PageHeader } from '@/ui/page-header';
import { EmptyState, ErrorState, SkeletonRows } from '@/ui/states';
import { TextField } from '@/ui/text-field';
import { useFleet } from '../services/use-fleet';
import { DeviceRow, FleetTableHeader } from './components/device-row';
import { RegisterDeviceDialog } from './components/register-device.dialog';

export function FleetPage() {
    const { t } = useTranslation();
    const { fleet, isPending, error, refetch, lastUpdatedAt } = useFleet();

    const [term, setTerm] = useState('');
    const [registerOpen, setRegisterOpen] = useState(false);

    // note: filtering happens on the client because the whole roster is already in memory — it came
    // down in one call and is not paged. Asking the server to filter would add a round trip per
    // keystroke to narrow a list the browser can search instantly. This stops being the right answer
    // at the point the device list itself needs paging, which is the same point the fan-out in
    // use-fleet needs replacing.
    const visible = useMemo(() => {
        const needle = term.trim().toLowerCase();
        if (!needle) {
            return fleet;
        }
        return fleet.filter(
            ({ device }) =>
                device.name.toLowerCase().includes(needle) ||
                device.id.toLowerCase().includes(needle),
        );
    }, [fleet, term]);

    return (
        <>
            <PageHeader
                title={t('devices.title')}
                subtitle={t('devices.subtitle', { count: fleet.length })}
                meta={
                    fleet.length > 0 ? (
                        <LiveIndicator
                            intervalMs={env.telemetryPollIntervalMs}
                            lastUpdatedAt={lastUpdatedAt}
                        />
                    ) : null
                }
                actions={
                    <Button onClick={() => setRegisterOpen(true)} icon={<PlusIcon />}>
                        {t('devices.register.action')}
                    </Button>
                }
            />

            {/* note: the search box appears only once there is enough to search. Below that it is
                furniture that makes an already-small screen look busier without helping anyone. */}
            {fleet.length > 5 ? (
                <div className="mb-4 max-w-xs">
                    <TextField
                        label={t('devices.search')}
                        type="search"
                        value={term}
                        onChange={(event) => setTerm(event.target.value)}
                    />
                </div>
            ) : null}

            <Card>
                {isPending ? (
                    <SkeletonRows rows={4} columns={['w-40', 'w-20', 'w-24', 'w-16', 'w-28']} />
                ) : error ? (
                    <ErrorState error={error} onRetry={() => void refetch()} />
                ) : fleet.length === 0 ? (
                    <EmptyState
                        icon={<DeviceIcon />}
                        title={t('devices.empty.title')}
                        body={t('devices.empty.body')}
                        action={
                            <Button onClick={() => setRegisterOpen(true)} icon={<PlusIcon />}>
                                {t('devices.empty.action')}
                            </Button>
                        }
                    />
                ) : visible.length === 0 ? (
                    <EmptyState title={t('devices.searchEmpty', { term: term.trim() })} />
                ) : (
                    <>
                        <FleetTableHeader />
                        <div className="divide-line divide-y">
                            {visible.map((entry) => (
                                <DeviceRow key={entry.device.id} entry={entry} />
                            ))}
                        </div>
                    </>
                )}
            </Card>

            <RegisterDeviceDialog
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
            />
        </>
    );
}

function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
    );
}

function DeviceIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="size-9" aria-hidden="true">
            <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
