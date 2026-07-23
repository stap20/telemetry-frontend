// cypod-telemetry
// src/modules/auth/views/redirect-target.ts

const HOME = '/';

// note: `redirect` reaches this function from the query string, which means an attacker can put
// anything in it and send someone the link. Navigating to it unchecked is the open-redirect
// pattern: the victim signs in on the real site and is then handed to `https://evil.example` — with
// the trust of having just authenticated, which is exactly what makes the fake login form that
// greets them work. Only same-origin absolute paths are accepted.
//
// The "//" case is the one that gets missed: `//evil.example` starts with a slash and is a
// protocol-relative URL to another host, so a naive `startsWith('/')` check lets it straight
// through.
export function safeRedirectTarget(candidate: string | undefined): string {
    if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
        return HOME;
    }
    return candidate;
}
