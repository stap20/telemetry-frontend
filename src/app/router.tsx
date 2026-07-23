// cypod-telemetry
// src/app/router.tsx
import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    redirect,
} from '@tanstack/react-router';

import { sessionStore } from '@/modules/auth/services/session.store';
import { LoginPage } from '@/modules/auth/views/login.page';
import { RegisterPage } from '@/modules/auth/views/register.page';
import { FleetPage } from '@/modules/devices/views/fleet.page';
import { DeviceDetailPage } from '@/modules/devices/views/device-detail.page';
import { AlertsPage } from '@/modules/alerts/views/alerts.page';
import { AppShell } from './app-shell';

// note: routes are declared in code rather than generated from a file tree. The generator needs a
// build step and commits a machine-written route file; with this many routes the tree fits on one
// screen and the guard below is visible in the same place as the routes it protects, which is where
// a reviewer will look for it.

const rootRoute = createRootRoute({ component: Outlet });

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    // note: the search schema is validated rather than read raw, so `redirect` is a typed string on
    // the way out. It is still not trusted — see safeRedirectTarget — because validating a shape
    // says nothing about where the value points.
    // note: the key is omitted rather than set to undefined when absent, which makes it OPTIONAL in
    // the generated types. Returning `{ redirect: undefined }` types it as a required property that
    // may hold undefined, and every plain <Link to="/login"> in the app then fails to compile for
    // want of a search object it has no reason to pass.
    validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
        typeof search.redirect === 'string' ? { redirect: search.redirect } : {},
    component: LoginPage,
});

const registerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/register',
    component: RegisterPage,
});

// note: a pathless layout route. Every child inherits the guard by construction, so a route added
// later is protected because of where it sits in the tree rather than because someone remembered to
// wrap it — the failure mode of per-route guards is silent and invisible in review.
//
// This is a routing convenience, not a security boundary: it decides which screen to render, and
// the backend independently rejects every request without a valid cookie. A user who deletes the
// localStorage profile check gets an empty dashboard full of 401s, not data.
const protectedRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'authenticated',
    beforeLoad: ({ location }) => {
        if (!sessionStore.get()) {
            throw redirect({ to: '/login', search: { redirect: location.href } });
        }
    },
    component: AppShell,
});

const fleetRoute = createRoute({
    getParentRoute: () => protectedRoute,
    path: '/',
    component: FleetPage,
});

// note: the route reads its own param and passes it down as a plain prop, rather than the page
// calling useParams. It keeps the page a function of its inputs — renderable in a test or a
// different route without a router in scope — and it is fully typed, whereas useParams from inside
// the component needs the route's id as a string literal and would make this file and the page
// import each other.
const deviceDetailRoute = createRoute({
    getParentRoute: () => protectedRoute,
    path: '/devices/$deviceId',
    component: function DeviceDetailRoute() {
        const { deviceId } = deviceDetailRoute.useParams();
        return <DeviceDetailPage deviceId={deviceId} />;
    },
});

const alertsRoute = createRoute({
    getParentRoute: () => protectedRoute,
    path: '/alerts',
    component: AlertsPage,
});

const routeTree = rootRoute.addChildren([
    loginRoute,
    registerRoute,
    protectedRoute.addChildren([fleetRoute, deviceDetailRoute, alertsRoute]),
]);

export const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

const PUBLIC_PATHS = new Set(['/login', '/register']);

// note: the guard above only runs when a navigation happens, but a session can end without one —
// a background poll returning 401 while the user sits reading the page. This subscription closes
// that gap: the moment the session is gone, whoever is looking at a protected screen is moved to
// the login form instead of watching every panel fill with errors.
//
// The path they were on is carried along, so signing back in returns them there rather than
// dumping them at the top of the application.
export function installSessionRedirect(): void {
    sessionStore.subscribe(() => {
        if (sessionStore.get() !== null) {
            return;
        }

        const { pathname, href } = router.state.location;
        if (PUBLIC_PATHS.has(pathname)) {
            return;
        }

        void router.navigate({ to: '/login', search: { redirect: href } });
    });
}
