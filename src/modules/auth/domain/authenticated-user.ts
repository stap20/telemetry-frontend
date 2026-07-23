// cypod-telemetry
// src/modules/auth/domain/authenticated-user.ts

// note: the frontend's OWN model of a signed-in user. It is deliberately not the backend's
// AuthResponseDto: it carries `displayName` and `initials`, which the backend does not send and
// should not have to, and it does NOT carry the access token, which the backend does send.
// Views depend on this type and never on the wire shape, so a backend rename — `id` becoming
// `userId`, `firstName`/`lastName` collapsing into one field — is absorbed by one mapper instead of
// rippling through every component that greets the user by name.
export interface AuthenticatedUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    initials: string;
}

export interface Credentials {
    email: string;
    password: string;
}

export interface Registration extends Credentials {
    firstName: string;
    lastName: string;
}
