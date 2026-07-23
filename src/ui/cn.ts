// cypod-telemetry
// src/ui/cn.ts

// note: deliberately not clsx + tailwind-merge. Those two packages exist to resolve conflicting
// Tailwind classes at runtime, which is only necessary when components accept arbitrary overrides.
// The components here expose variants instead, so conflicts cannot arise and a dependency that
// parses class names on every render would be paying for a problem this codebase does not have.
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
    return values.filter(Boolean).join(' ');
}
