// cypod-telemetry
// src/app/app.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { queryClient } from '@/core/query/query-client';
import { router } from './router';

// note: providers are assembled here rather than in main.tsx so that main stays a short entry point
// and the provider stack — which grows — has one obvious home. Query sits outside Router because
// route components use queries; the reverse nesting would put the cache out of their reach.
export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
}
