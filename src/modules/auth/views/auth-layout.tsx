// cypod-telemetry
// src/modules/auth/views/auth-layout.tsx
import type { ReactNode } from 'react';
import { BrandMark } from '@/app/brand-mark';
import { LanguageSwitcher } from '@/ui/language-switcher';

// note: the language switcher is on the sign-in screen, not only inside the app. A user who cannot
// read English needs to change the language BEFORE they can find their way in, and putting the
// control behind the login form is a common way to make an interface unusable for exactly the
// people the translation was added for.
export function AuthLayout({
    title,
    subtitle,
    children,
    footer,
    notice,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer: ReactNode;
    notice?: ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col">
            {/* note: a single soft radial wash behind the card. It gives the page a focal point
                without a background image to download, and it is symmetric, so it does not need
                mirroring when the layout flips to RTL. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
            />

            <header className="relative flex items-center justify-between px-5 py-5">
                <BrandMark />
                <LanguageSwitcher />
            </header>

            <main className="relative flex grow items-center justify-center px-4 pb-16">
                <div className="w-full max-w-sm">
                    <h1 className="text-ink text-2xl font-semibold tracking-tight">{title}</h1>
                    <p className="text-muted mt-1.5 text-sm">{subtitle}</p>

                    {notice}

                    <div className="mt-7">{children}</div>

                    <p className="text-muted mt-6 text-center text-sm">{footer}</p>
                </div>
            </main>
        </div>
    );
}
