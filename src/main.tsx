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
import { installSessionExpiryHandler } from '@/modules/auth/services/session-expiry';
import { installSessionRedirect } from '@/app/router';
import { App } from '@/app/app';

// note: the composition root. Cross-cutting wiring happens here, once, before React starts — not
// inside an effect, where StrictMode's double-invocation would register every interceptor twice and
// each request would carry duplicated headers.
//
// It is also the only place that knows about both `core` and `modules`. core/http exposes the
// interceptor hooks without knowing what a session is; the auth module supplies the policy. That
// keeps the platform layer free of feature knowledge while still letting a feature react to every
// request the application makes.
installLanguageInterceptor();
installSessionExpiryHandler();
installSessionRedirect();

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root is missing from index.html');
}

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
