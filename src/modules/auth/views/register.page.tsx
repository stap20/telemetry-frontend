// cypod-telemetry
// src/modules/auth/views/register.page.tsx
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';

import { useApiErrorMessage } from '@/core/http/use-api-error-message';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { Notice } from '@/ui/notice';
import { AuthLayout } from './auth-layout';
import { useRegister } from '../services/use-session';
import {
    validateRegistration,
    hasErrors,
    MIN_PASSWORD_LENGTH,
    type FieldErrors,
} from '../domain/validation';
import type { Registration } from '../domain/authenticated-user';

const EMPTY: Registration = { email: '', password: '', firstName: '', lastName: '' };

export function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const describeError = useApiErrorMessage();
    const register = useRegister();

    const [form, setForm] = useState<Registration>(EMPTY);
    const [errors, setErrors] = useState<FieldErrors<Registration>>({});

    function update(field: keyof Registration, value: string) {
        setForm((previous) => ({ ...previous, [field]: value }));
        setErrors((previous) => ({ ...previous, [field]: undefined }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        const found = validateRegistration(form);
        setErrors(found);
        if (hasErrors(found)) {
            return;
        }

        // note: registration signs the user straight in — the backend issues the session cookie on
        // the same response — so there is no second trip through the login form to reach the fleet.
        register.mutate(form, { onSuccess: () => void navigate({ to: '/' }) });
    }

    return (
        <AuthLayout
            title={t('auth.register.title')}
            subtitle={t('auth.register.subtitle')}
            footer={
                <>
                    {t('auth.register.haveAccount')}{' '}
                    <Link to="/login" className="text-brand font-medium hover:underline">
                        {t('auth.register.signIn')}
                    </Link>
                </>
            }
        >
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                {register.isError ? (
                    <Notice tone="fault">{describeError(register.error)}</Notice>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                    <TextField
                        label={t('auth.fields.firstName')}
                        autoComplete="given-name"
                        autoFocus
                        value={form.firstName}
                        onChange={(event) => update('firstName', event.target.value)}
                        error={errors.firstName && t(errors.firstName)}
                    />
                    <TextField
                        label={t('auth.fields.lastName')}
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(event) => update('lastName', event.target.value)}
                        error={errors.lastName && t(errors.lastName)}
                    />
                </div>

                <TextField
                    label={t('auth.fields.email')}
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    error={errors.email && t(errors.email)}
                />
                <TextField
                    label={t('auth.fields.password')}
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    error={
                        errors.password &&
                        t(errors.password, { count: MIN_PASSWORD_LENGTH })
                    }
                />

                <Button type="submit" loading={register.isPending} className="mt-2 w-full">
                    {register.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
                </Button>
            </form>
        </AuthLayout>
    );
}
