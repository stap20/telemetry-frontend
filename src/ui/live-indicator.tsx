// cypod-telemetry
// src/ui/live-indicator.tsx
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/core/i18n/use-format';

// note: a polling screen that looks identical to a frozen one is the fastest way to lose a user's
// trust in the data. This says three things at once: that the view updates by itself, how often,
// and when it last actually succeeded — the last being the one that matters, because a pulsing dot
// above a stale timestamp is exactly the situation an operator needs to notice.
export function LiveIndicator({
    intervalMs,
    lastUpdatedAt,
}: {
    intervalMs: number;
    lastUpdatedAt: number;
}) {
    const { t } = useTranslation();
    const format = useFormat();

    return (
        <span className="flex items-center gap-1.5">
            <span className="relative flex size-1.5">
                <span className="bg-status-ok absolute inline-flex size-full animate-ping rounded-full opacity-75" />
                <span className="bg-status-ok relative inline-flex size-1.5 rounded-full" />
            </span>
            <span className="text-faint text-xs">
                {t('devices.pollingNote', { seconds: Math.round(intervalMs / 1000) })}
                {lastUpdatedAt > 0
                    ? ` · ${t('common.updated', { when: format.relative(new Date(lastUpdatedAt)) })}`
                    : ''}
            </span>
        </span>
    );
}
