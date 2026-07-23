// cypod-telemetry
// src/modules/devices/views/components/register-device.dialog.tsx
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useApiErrorMessage } from '@/core/http/use-api-error-message';
import { Button } from '@/ui/button';
import { Modal } from '@/ui/modal';
import { Notice } from '@/ui/notice';
import { TextField } from '@/ui/text-field';
import { useRegisterDevice } from '../../services/use-device';
import type { DeviceRegistration } from '../../domain/device';

const EMPTY: DeviceRegistration = { id: '', name: '' };

export function RegisterDeviceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { t } = useTranslation();
    const describeError = useApiErrorMessage();
    const register = useRegisterDevice();

    const [form, setForm] = useState<DeviceRegistration>(EMPTY);
    const [touched, setTouched] = useState(false);

    const missingId = touched && !form.id.trim();
    const missingName = touched && !form.name.trim();

    function submit(event: FormEvent) {
        event.preventDefault();
        setTouched(true);

        if (!form.id.trim() || !form.name.trim()) {
            return;
        }

        register.mutate(form, {
            onSuccess: () => {
                // note: reset on success only. A failed submission — most often a duplicate id —
                // keeps what was typed, so correcting one character does not mean retyping both
                // fields.
                setForm(EMPTY);
                setTouched(false);
                onClose();
            },
        });
    }

    return (
        <Modal open={open} onClose={onClose} title={t('devices.register.title')}>
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                <p className="text-muted -mt-1 text-sm">{t('devices.register.subtitle')}</p>

                {register.isError ? (
                    <Notice tone="fault">{describeError(register.error)}</Notice>
                ) : null}

                <TextField
                    label={t('devices.register.id')}
                    hint={t('devices.register.idHint')}
                    autoFocus
                    // note: device identifiers are hardware serials — always Latin, never
                    // autocorrected. dir="ltr" keeps them readable while the rest of the dialog is
                    // right-to-left, and the autocapitalize/autocorrect pair stops a phone keyboard
                    // from "helpfully" rewriting sensor-a1b2c3.
                    dir="ltr"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={form.id}
                    onChange={(event) => setForm((f) => ({ ...f, id: event.target.value }))}
                    error={missingId ? t('devices.register.idRequired') : undefined}
                />

                <TextField
                    label={t('devices.register.name')}
                    hint={t('devices.register.nameHint')}
                    value={form.name}
                    onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                    error={missingName ? t('devices.register.nameRequired') : undefined}
                />

                <div className="mt-1 flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" loading={register.isPending}>
                        {register.isPending
                            ? t('devices.register.submitting')
                            : t('devices.register.submit')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
