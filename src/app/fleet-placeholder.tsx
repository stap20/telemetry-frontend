// cypod-telemetry
// src/app/fleet-placeholder.tsx
import { useTranslation } from 'react-i18next';
import { Card } from '@/ui/card';
import { EmptyState } from '@/ui/states';

// note: temporary landing page for the protected route, so this stage can be verified end to end —
// sign in, land somewhere guarded, sign out — before the fleet list exists. Replaced by the real
// devices view in the next stage.
export function FleetPage() {
    const { t } = useTranslation();

    return (
        <Card>
            <EmptyState title={t('devices.title')} body={t('common.loading')} />
        </Card>
    );
}
