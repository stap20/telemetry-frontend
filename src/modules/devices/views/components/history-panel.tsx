// cypod-telemetry
// src/modules/devices/views/components/history-panel.tsx
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormat } from '@/core/i18n/use-format';
import { Button } from '@/ui/button';
import { Card, CardHeader } from '@/ui/card';
import { cn } from '@/ui/cn';
import { EmptyState, ErrorState, SkeletonRows } from '@/ui/states';
import { TextField } from '@/ui/text-field';
import { useDeviceHistory } from '../../services/use-device';
import { HISTORY_PAGE_SIZE, type TelemetryReading } from '../../domain/telemetry-reading';
import { BatteryValue, PositionValue, StatusBadge, TemperatureValue } from './measurements';

const GRID =
    'grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-[minmax(0,12rem)_7rem_8rem_7rem_minmax(0,1fr)] md:gap-y-0 md:items-center';

// note: what the two inputs hold, which is NOT what the endpoint takes. `datetime-local` produces a
// wall-clock string with no zone ("2026-06-01T12:00"), so it is kept verbatim as the field value and
// converted to an instant only at the edge — see toInstant.
interface DraftRange {
    from: string;
    to: string;
}

const EMPTY_RANGE: DraftRange = { from: '', to: '' };

// note: the input's value is the user's LOCAL wall clock, so it is handed to the Date constructor
// unqualified and allowed to be interpreted in the browser's zone before being serialised as UTC.
// Appending a 'Z' instead would be the tempting one-liner and would silently shift the window by the
// user's offset — "since 9am" would mean 9am UTC to someone in Cairo.
function toInstant(value: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function HistoryPanel({ deviceId }: { deviceId: string }) {
    const { t } = useTranslation();
    const format = useFormat();
    const [offset, setOffset] = useState(0);
    const [range, setRange] = useState<DraftRange>(EMPTY_RANGE);

    const isFiltered = range.from !== '' || range.to !== '';
    // note: compared as strings on purpose. `YYYY-MM-DDTHH:mm` sorts lexicographically in the same
    // order it sorts chronologically, so this needs no parsing and no zone — and both bounds are in
    // the same zone by construction, which is the only thing that could make it wrong.
    const isInverted = range.from !== '' && range.to !== '' && range.from > range.to;

    const query = useDeviceHistory(
        deviceId,
        {
            offset,
            limit: HISTORY_PAGE_SIZE,
            from: toInstant(range.from),
            to: toInstant(range.to),
        },
        { enabled: !isInverted },
    );
    const page = query.data;

    const total = page?.total ?? 0;
    const hasPrevious = offset > 0;
    const hasNext = offset + HISTORY_PAGE_SIZE < total;

    // note: any change to the window resets to the first page. Staying on page 4 of a result set
    // that just shrank to one page is how a filter appears to return nothing at all.
    const editRange = (patch: Partial<DraftRange>) => {
        setRange((current) => ({ ...current, ...patch }));
        setOffset(0);
    };

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

            <div className="border-line flex flex-wrap items-end gap-3 border-b px-5 py-3">
                <TextField
                    label={t('deviceDetail.history.filter.from')}
                    type="datetime-local"
                    value={range.from}
                    // note: `max`/`min` mirror the other bound so the native picker steers away from
                    // an inverted range in the first place. It is a nudge, not the guard — a typed
                    // value bypasses it entirely, which is why isInverted is still checked below.
                    max={range.to || undefined}
                    onChange={(event) => editRange({ from: event.target.value })}
                    className="w-full sm:w-52"
                />
                <TextField
                    label={t('deviceDetail.history.filter.to')}
                    type="datetime-local"
                    value={range.to}
                    min={range.from || undefined}
                    error={isInverted ? t('deviceDetail.history.filter.inverted') : undefined}
                    onChange={(event) => editRange({ to: event.target.value })}
                    className="w-full sm:w-52"
                />
                {isFiltered ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            setRange(EMPTY_RANGE);
                            setOffset(0);
                        }}
                    >
                        {t('deviceDetail.history.filter.clear')}
                    </Button>
                ) : null}
            </div>

            {/* note: the inverted-range branch comes first because the query is disabled in that
                state, and a disabled query reports isPending forever — checking isPending first
                would leave the panel showing skeleton rows for a load that is never going to
                happen. */}
            {isInverted ? (
                <EmptyState
                    title={t('deviceDetail.history.filter.invalid.title')}
                    body={t('deviceDetail.history.filter.invalid.body')}
                />
            ) : query.isPending ? (
                <SkeletonRows rows={6} columns={['w-32', 'w-16', 'w-20', 'w-14', 'w-28']} />
            ) : query.error ? (
                <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            ) : total === 0 ? (
                // note: an empty page means two different things and the message has to say which.
                // "This device has never reported" is a fact about the device; "nothing in this
                // window" is a fact about the filter the user just typed, and telling them the
                // former while a range is active reads as though the filter broke something.
                <EmptyState
                    title={t(
                        isFiltered
                            ? 'deviceDetail.history.filter.noMatches.title'
                            : 'deviceDetail.history.empty.title',
                    )}
                    body={t(
                        isFiltered
                            ? 'deviceDetail.history.filter.noMatches.body'
                            : 'deviceDetail.history.empty.body',
                    )}
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
