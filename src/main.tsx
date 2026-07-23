// cypod-telemetry
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/theme.css';
// note: imported for its side effect — initialising i18next and setting the document's lang/dir —
// and imported FIRST so no component can render before a language exists. Rendering ahead of it
// would flash English at an Arabic user and lay the page out left-to-right before flipping it.
import '@/core/i18n/i18n';

import { installLanguageInterceptor } from '@/core/http/interceptors';
import { App } from '@/app/app';

// note: the composition root. Cross-cutting wiring happens here, once, before React starts —
// not inside an effect, where StrictMode's double-invocation would register every interceptor twice
// and each request would carry duplicated headers.
installLanguageInterceptor();

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root is missing from index.html');
}

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
