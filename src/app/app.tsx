// cypod-telemetry
// src/app/app.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { queryClient } from '@/core/query/query-client';
import { LanguageSwitcher } from '@/ui/language-switcher';
import { Card, CardBody, CardHeader } from '@/ui/card';
import { BrandMark } from './brand-mark';

// note: providers are assembled here rather than in main.tsx so that main stays a four-line entry
// point and the provider stack — which grows — has one obvious home.
export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="flex min-h-screen flex-col">
                <TopBar />
                <main className="mx-auto w-full max-w-6xl grow px-4 py-8">
                    <Placeholder />
                </main>
            </div>
        </QueryClientProvider>
    );
}

// note: `border-b` and flex order are direction-agnostic; the brand sits at the inline start and the
// controls at the inline end in both languages because the layout is expressed as flex order, never
// as `left`/`right`. This is why the whole interface flips from one attribute on <html>.
function TopBar() {
    return (
        <header className="border-line bg-surface/80 sticky top-0 z-20 border-b backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
                <BrandMark />
                <LanguageSwitcher />
            </div>
        </header>
    );
}

// note: temporary. The routed views land on top of this shell in the next stage; the shell itself,
// the brand mark and the language switcher are final.
function Placeholder() {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader title={t('app.name')} subtitle={t('app.tagline')} />
            <CardBody>
                <p className="text-muted text-sm">{t('common.loading')}</p>
            </CardBody>
        </Card>
    );
}
