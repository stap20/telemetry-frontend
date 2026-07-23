# Cypod Telemetry — Console

A fleet-monitoring web console for the Cypod telemetry service: sign in, watch each
device's latest state update live, drill into a device's recent history, and see which
thresholds are currently breached. The interface is fully localized in English and
Arabic, and flips to a right-to-left layout when Arabic is selected.

## Stack

- **React 19** + **TypeScript 7**, built with **Vite 8**
- **TanStack Query** for server state (polling, caching, retries)
- **TanStack Router** for code-defined, type-safe routing with route guards
- **i18next / react-i18next** for localization
- **Tailwind CSS v4** for styling (design tokens via `@theme`)

## Getting started

Prerequisites: Node 20+ and the backend API running (default `http://localhost:3000`).

```bash
npm install
cp .env.example .env.local   # adjust only if the backend is not on :3000
npm run dev                  # serves on http://localhost:5173
```

Then open http://localhost:5173 and register an account or sign in.

Scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (proxies `/api` → backend) |
| `npm run build` | Type-check the whole project, then produce a production build |
| `npm run typecheck` | Type-check without emitting |
| `npm run preview` | Serve the production build locally |

### Why there is a dev proxy and no absolute API URL

The session credential is the backend's **httpOnly cookie** — the token is never exposed
to JavaScript. That cookie is `secure`, `sameSite: strict`, so the browser only sends it
back on **same-origin** requests. The Vite dev server therefore proxies `/api` to the
backend so that, from the browser's point of view, the app and the API share one origin.
In production the two are expected to sit behind the same origin for the same reason,
which is why the config carries a proxy *target* (`VITE_API_TARGET`) rather than an
absolute API base URL. Every request is sent with `credentials: 'include'`; the app keeps
only a display profile (name, email, initials) in `localStorage`, never the token.

## Architecture

The code is organized **layered per module**. Each feature under `src/modules/*` owns the
same four layers, so a screen's data flow reads top to bottom within one folder:

```
modules/<feature>/
  domain/     types + validation — the frontend's own vocabulary
  data/       dto (wire shapes) + mapper (wire → domain) + repository (calls)
  services/   custom hooks (TanStack Query) + client-side stores
  views/      pages and components
```

`src/core/*` is the platform layer (HTTP gateway, i18n, query client, config). The
dependency rule runs **one way**: `modules` may use `core`, but `core` never imports from
`modules`.

A few decisions are worth calling out because they shaped the rest of the code:

- **One HTTP gateway.** Every backend call goes through a single `HttpClient`
  (`core/http`). Repositories are its only callers. Request and error interceptors are
  registered once at the composition root (`main.tsx`), so cross-cutting concerns —
  attaching `Accept-Language`, and reacting to an expired session — live in exactly one
  place instead of being sprinkled across call sites.

- **Errors are classified by *kind*, not status number.** `ApiError` normalizes every
  failure to a `kind` (`network`, `unauthorized`, `validation`, `rateLimited`, `server`,
  …). The retry policy, the session-expiry handler, and the UI all branch on that kind, so
  no component ever hard-codes `if (status === 429)`. Backend messages are shown verbatim
  when they are genuinely human-readable, and replaced with a translated fallback when
  they are framework noise (e.g. `"Bad Request Exception"`).

- **Mappers isolate the views from the wire.** The frontend domain deliberately differs
  from the backend payload: the auth response's `accessToken` is dropped (the cookie is
  the only credential), a device's `lat`/`lng` collapse into a nullable `position`, a
  loose status string is narrowed to a union with an `UNKNOWN` fallback, ISO strings
  become `Date`s, and an alert's pre-composed localized `message` is dropped in favour of
  composing presentation from its structured fields. If the backend renames a field, the
  change stops at the mapper.

- **Services are custom hooks.** Components never touch a repository or the query client
  directly; they call hooks like `useFleet()`, `useLatestState(id)`, `useActiveAlerts()`.
  Query keys are centralized and hierarchical (`core/query/query-keys.ts`) so a mutation
  can invalidate a whole subtree, and so the header's alert badge and the alerts page
  share one cache entry.

## Screens

- **Sign in / Register** — validated forms; on success a session starts and the app
  redirects to the fleet (honouring a safe `redirect` target if the user was bounced from
  a guarded route).
- **Fleet** — every registered device with its latest status, polling roughly every 5s.
  Client-side search appears once the fleet grows past a handful of devices.
- **Device detail** — the latest state (with a badge showing whether the backend served it
  from cache or the database) plus paginated recent history.
- **Alerts** — every threshold currently breached, as labelled figures (reading vs.
  threshold), polled live with a matching count in the top bar.

### "Registered but never reported" is a first-class state, not an error

A device that has been registered but has not yet sent any telemetry returns `404` from
the latest-state endpoint — the same status as "no such device." The app resolves the
ambiguity using the user's **own device roster** as the authority: if the id is in your
fleet, a `404` means *no data yet* and the UI shows a calm "Never reported" state on both
the fleet row and the detail page; only an id absent from the roster is treated as
"device not found."

## Localization & right-to-left

- **No hardcoded user-facing strings.** All copy lives in `core/i18n/locales/{en,ar}.json`
  and is read through `t()`.
- **Direction is applied in one non-bypassable place.** A handler on i18next's
  `languageChanged` event sets `lang` and `dir` on the document, so selecting Arabic flips
  the entire layout to `dir="rtl"`. Components use logical Tailwind utilities
  (`ms-auto`, `rtl:-scale-x-100`) so they mirror correctly without duplicated styles.
- **Dates and relative times come from `Intl`.** Relative times ("3 minutes ago") use
  `Intl.RelativeTimeFormat` rather than hand-written plural keys — Arabic has six plural
  categories, and the platform already ships the correct forms.
- **Bidi is handled deliberately.** Arabic uses Western (Latin) digits so technical values
  line up in a table, and compound values like a pagination range (`1–25`) are wrapped in
  Unicode isolates so the bidi algorithm does not reorder them into `25–1` inside an
  Arabic sentence.

## Conventions

- Every source file opens with a `// cypod-telemetry` header line.
- Deliberate trade-offs are marked with `// note:` comments explaining the *why* rather
  than the *what*. The most notable is the fleet's **N+1 fan-out**: `GET /devices` returns
  only identity fields, so each device's latest state is a separate request per poll. It is
  documented in `services/use-fleet.ts` with a server-side `?include=latest` fix noted as
  the follow-up.
