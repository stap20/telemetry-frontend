// cypod-telemetry
// src/modules/auth/domain/validation.ts
import type { Credentials, Registration } from './authenticated-user';

// note: mirrors the backend's own rules (@IsEmail, @MinLength(5)) so the user is told what is wrong
// before a round trip. It is a convenience, NOT the enforcement — the server validates again and is
// the only opinion that counts. Duplicating a rule is acceptable here precisely because the
// duplicate cannot grant anything: the worst a stale copy can do is submit a form the server then
// rejects with its own message.
export const MIN_PASSWORD_LENGTH = 5;

// note: validators return translation KEYS, never sentences. The domain has no idea which language
// the interface is in, and the moment it does, half the copy stops being switchable.
export type ValidationKey =
    | 'auth.validation.emailRequired'
    | 'auth.validation.emailInvalid'
    | 'auth.validation.passwordRequired'
    | 'auth.validation.passwordTooShort'
    | 'auth.validation.firstNameRequired'
    | 'auth.validation.lastNameRequired';

export type FieldErrors<T> = Partial<Record<keyof T, ValidationKey>>;

// note: deliberately permissive. A frontend regex cannot decide whether an address exists, and the
// strict-looking patterns in circulation reject valid addresses — apostrophes, new TLDs, plus-
// addressing. Catching "no @ at all" is the whole useful contribution; the server and the inbox
// settle the rest.
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(credentials: Credentials): FieldErrors<Credentials> {
    const errors: FieldErrors<Credentials> = {};

    const email = credentials.email.trim();
    if (!email) {
        errors.email = 'auth.validation.emailRequired';
    } else if (!LOOKS_LIKE_EMAIL.test(email)) {
        errors.email = 'auth.validation.emailInvalid';
    }

    if (!credentials.password) {
        errors.password = 'auth.validation.passwordRequired';
    }

    return errors;
}

export function validateRegistration(registration: Registration): FieldErrors<Registration> {
    // note: the credential rules are reused rather than restated, so "what counts as a valid email"
    // cannot come to mean two different things on two different forms.
    const errors: FieldErrors<Registration> = validateCredentials(registration);

    if (registration.password && registration.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = 'auth.validation.passwordTooShort';
    }
    if (!registration.firstName.trim()) {
        errors.firstName = 'auth.validation.firstNameRequired';
    }
    if (!registration.lastName.trim()) {
        errors.lastName = 'auth.validation.lastNameRequired';
    }

    return errors;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
    return Object.keys(errors).length > 0;
}
