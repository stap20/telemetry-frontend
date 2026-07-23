// cypod-telemetry
// src/modules/auth/data/auth.dto.ts

// note: the wire contract, transcribed from the backend's presentation DTOs and nothing more. These
// types exist to be the single place the backend's vocabulary appears in this codebase; everything
// above the mapper speaks the frontend's own domain language. They are intentionally not shared
// with the views, which is why they live under data/ rather than domain/.

export interface AuthResponseDto {
    // note: the backend's AuthResponseDto names this `id`, while its command result calls the same
    // value `userId`. The frontend follows what is actually on the wire.
    id: string;
    email: string;
    firstName: string;
    lastName: string;

    // note: present in the body, and deliberately dropped by the mapper. The same token is set as an
    // httpOnly cookie, which is the copy the browser sends back. Keeping this one in JavaScript
    // would create a second, XSS-readable copy of a credential we otherwise never expose — the whole
    // point of the cookie being httpOnly.
    accessToken: string;
}

export interface LoginRequestDto {
    email: string;
    password: string;
}

export interface RegisterRequestDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
