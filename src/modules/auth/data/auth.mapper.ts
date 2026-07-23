// cypod-telemetry
// src/modules/auth/data/auth.mapper.ts
import type { AuthenticatedUser, Credentials, Registration } from '../domain/authenticated-user';
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from './auth.dto';

// note: derived values are computed HERE, once, rather than in the components that display them.
// `${firstName} ${lastName}` looks harmless inline until it appears in a header, a menu and a
// tooltip — three places to fix when a user turns out to have no last name.
function buildDisplayName(firstName: string, lastName: string): string {
    return [firstName, lastName].map((part) => part.trim()).filter(Boolean).join(' ');
}

function buildInitials(firstName: string, lastName: string): string {
    // note: Array.from, not charAt(0) — an Arabic or emoji-bearing name can begin with a character
    // outside the basic plane, and charAt would slice it in half into an unrenderable half-pair.
    const initial = (value: string) => Array.from(value.trim())[0] ?? '';
    return `${initial(firstName)}${initial(lastName)}`.toUpperCase();
}

export const authMapper = {
    toDomain(dto: AuthResponseDto): AuthenticatedUser {
        return {
            id: dto.id,
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            displayName: buildDisplayName(dto.firstName, dto.lastName),
            initials: buildInitials(dto.firstName, dto.lastName),
        };
    },

    // note: mapping outward as well as inward. It looks redundant while the two shapes match, and
    // it is the reason they are allowed to stop matching: the login form's field names become a UI
    // decision rather than a contract with the server.
    toLoginRequest(credentials: Credentials): LoginRequestDto {
        return { email: credentials.email.trim(), password: credentials.password };
    },

    toRegisterRequest(registration: Registration): RegisterRequestDto {
        return {
            email: registration.email.trim(),
            password: registration.password,
            firstName: registration.firstName.trim(),
            lastName: registration.lastName.trim(),
        };
    },
};
