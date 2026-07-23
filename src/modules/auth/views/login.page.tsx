// cypod-telemetry
// src/modules/auth/views/login.page.tsx
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import { useApiErrorMessage } from '@/core/http/use-api-error-message';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { Notice } from '@/ui/notice';
import { AuthLayout } from './auth-layout';
import { useLogin } from '../services/use-session';
import { sessionStore } from '../services/session.store';
import { validateCredentials, hasErrors, type FieldErrors } from '../domain/validation';
import type { Credentials } from '../domain/authenticated-user';
import { safeRedirectTarget } from './redirect-target';

const EMPTY: Credentials = { email: '', password: '' };

export function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const describeError = useApiErrorMessage();
    const login = useLogin();
    const { redirect } = useSearch({ from: '/login' });

    const [form, setForm] = useState<Credentials>(EMPTY);
    const [errors, setErrors] = useState<FieldErrors<Credentials>>({});
    // note: read once on mount and consumed, so re-renders caused by typing do not keep
    // re-triggering the notice, and navigating here later does not resurrect it.
    const [expired] = useState(() => sessionStore.consumeExpiryNotice());

    function update(field: keyof Credentials, value: string) {
        setForm((previous) => ({ ...previous, [field]: value }));
        // note: clear this field's error as soon as it is edited. Leaving it until the next submit
        // means the user corrects the field and is still shown the complaint about it.
        setErrors((previous) => ({ ...previous, [field]: undefined }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        const found = validateCredentials(form);
        setErrors(found);
        if (hasErrors(found)) {
            return;
        }

        login.mutate(form, {
            onSuccess: () => void navigate({ to: safeRedirectTarget(redirect) }),
        });
    }

    return (
        <AuthLayout
            title={t('auth.signIn.title')}
            subtitle={t('auth.signIn.subtitle')}
            notice={
                expired ? (
                    <Notice tone="warn" className="mt-5">
                        {t('auth.sessionExpired')}
                    </Notice>
                ) : null
            }
            footer={
                <>
                    {t('auth.signIn.noAccount')}{' '}
                    <Link to="/register" className="text-brand font-medium hover:underline">
                        {t('auth.signIn.createOne')}
                    </Link>
                </>
            }
        >
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                {login.isError ? <Notice tone="fault">{describeError(login.error)}</Notice> : null}

                <TextField
                    label={t('auth.fields.email')}
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    error={errors.email && t(errors.email)}
                />
                <TextField
                    label={t('auth.fields.password')}
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    error={errors.password && t(errors.password)}
                />

                <Button type="submit" loading={login.isPending} className="mt-2 w-full">
                    {login.isPending ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
                </Button>
            </form>
        </AuthLayout>
    );
}
