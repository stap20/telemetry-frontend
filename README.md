# Cypod Telemetry — Console

A fleet-monitoring web console for the Cypod telemetry service: sign in, watch each device's latest
state update live, drill into its history, and see which thresholds are breached. Fully localized in
English and Arabic, flipping to a right-to-left layout when Arabic is selected.

**React 19** · **TypeScript 7** · **Vite 8** · **TanStack Query** · **TanStack Router** ·
**i18next** · **Tailwind v4**

---

## Running it

```bash
docker compose up --build     # http://localhost:8080
```

Two-stage build: Vite produces the bundle, **nginx** serves it — no Node in the runtime image, since
shipping a whole runtime to serve static assets buys nothing. nginx also proxies `/api`, which is
the *point* rather than a convenience: it's the production counterpart of the dev proxy, for the
cookie reason below. Two consequences of how Vite works:

- **`VITE_*` values are build args**, not runtime env — Vite inlines them, so changing
  `VITE_TELEMETRY_POLL_INTERVAL_MS` means rebuilding.
- **`API_UPSTREAM` is a runtime var**, substituted into the nginx config at container start, so one
  image can point at any backend.

Compose joins `cypod-net`, created by the **backend's** compose — bring that up first and nginx
reaches the API as `http://api:3000`. Against a backend on the host instead:

```bash
API_UPSTREAM=http://host.docker.internal:3000 docker compose up --build
```

<details>
<summary><b>Locally</b> — Node 20+, backend running on :3000</summary>

```bash
npm install
cp .env.example .env.local   # adjust only if the backend isn't on :3000
npm run dev                  # http://localhost:5173, proxies /api → backend
```

| Command | What it does |
| --- | --- |
| `npm run build` | Type-check the whole project, then produce a production build |
| `npm run typecheck` | Type-check without emitting |
| `npm run preview` | Serve the production build locally |
</details>

### Why there's a proxy and no absolute API URL

The session credential is the backend's **httpOnly cookie** — the token is never exposed to JS. That
cookie is `secure; sameSite=strict`, so the browser only sends it on **same-origin** requests. Both
the dev server and nginx therefore proxy `/api` so the app and API look like one origin, which is
why the config carries a proxy *target* rather than an API base URL. Every request uses
`credentials: 'include'`; only a display profile (name, email, initials) goes in `localStorage`,
never the token.

---

## Architecture

Layered per module — each feature under `src/modules/*` owns the same four layers, so a screen's
data flow reads top to bottom in one folder:

```
modules/<feature>/
  domain/     types + validation — the frontend's own vocabulary
  data/       dto (wire shapes) + mapper (wire → domain) + repository (calls)
  services/   custom hooks (TanStack Query) + client-side stores
  views/      pages and components
```

`src/core/*` is the platform layer (HTTP gateway, i18n, query client, config). The dependency rule
runs **one way**: `modules` may use `core`, `core` never imports from `modules`.

- **One HTTP gateway.** Every call goes through a single `HttpClient`; repositories are its only
  callers. Interceptors are registered once at the composition root, so `Accept-Language` and
  session-expiry handling live in exactly one place instead of across call sites.
- **Errors classified by *kind*, not status number.** `ApiError` normalizes every failure to a `kind`
  (`network`, `unauthorized`, `validation`, `rateLimited`, `server`…). Retry policy, session expiry
  and the UI all branch on that, so no component hard-codes `if (status === 429)`. Backend messages
  show verbatim when genuinely human-readable, and fall back to a translated string when they're
  framework noise (`"Bad Request Exception"`).
- **Mappers isolate views from the wire.** The domain deliberately differs from the payload:
  `accessToken` is dropped (the cookie is the only credential), `lat`/`lng` collapse into a nullable
  `position`, a loose status string narrows to a union with an `UNKNOWN` fallback, ISO strings become
  `Date`s, and an alert's pre-composed message is dropped in favour of its structured fields. A
  backend rename stops at the mapper.
- **Services are custom hooks.** Components never touch a repository or the query client — they call
  `useFleet()`, `useLatestState(id)`, `useActiveAlerts()`. Query keys are centralized and
  hierarchical, so a mutation can invalidate a subtree and the header badge shares one cache entry
  with the alerts page.

---

## Screens

- **Sign in / Register** — validated forms; on success the app redirects to the fleet, honouring a
  safe `redirect` target if the user was bounced from a guarded route.
- **Fleet** — every device with its latest status, polling ~5s. Client-side search appears once the
  fleet grows past a handful.
- **Device detail** — latest state (with a badge showing whether the backend served it from cache or
  the database) plus history, paginated and filterable by date range.
- **Alerts** — every breached threshold as labelled figures (reading vs. threshold), polled live with
  a matching count in the top bar.

### The history filter sends the dates the API documents

`GET /devices/:id/history` takes `from`, `to`, `offset`, `limit`. The panel was paginated before it
was filtered, which is a real distinction: pagination alone hands back the same readings 25 at a time
no matter what window you meant. Three details make the filter behave rather than merely exist:

- **The range is part of the react-query cache key**, not state beside it. A page of rows is only
  meaningful with the window that produced it; leaving the dates out serves rows from one range while
  the inputs claim another. They're ISO **strings** for the same reason — a `Date` compares by
  identity in a key, so two identical ranges would look different and refetch every render.
- **Changing a bound resets to page one.** Staying on page 4 of a result set that just shrank to one
  page is how a working filter appears to return nothing.
- **Bounds are read as local wall-clock time.** `datetime-local` yields a zoneless string, so it's
  parsed in the browser's zone and serialised to UTC at the edge. Appending `Z` is the tempting
  one-liner and silently shifts the window by the user's offset.

An inverted range is caught before the request: the endpoint does reject it (`400`), but spending a
round trip to be told something already known isn't worth it, so the query is disabled and the panel
explains itself. An empty window is **not** an error — "nothing happened in this range" and "this
device has never reported" are different facts and get different copy, since showing the latter
while a filter is active reads as though the filter broke something.

### "Registered but never reported" is a first-class state, not an error

A registered device that hasn't sent telemetry returns `404` from the latest-state endpoint — the
same status as "no such device". The app resolves the ambiguity using the user's **own roster** as
the authority: if the id is in your fleet, `404` means *no data yet* and the UI shows a calm "Never
reported" state; only an id absent from the roster is treated as "device not found".

---

## Localization & right-to-left

- **No hardcoded user-facing strings.** All copy lives in `core/i18n/locales/{en,ar}.json`, read
  through `t()`.
- **Direction is applied in one non-bypassable place.** A handler on i18next's `languageChanged`
  sets `lang` and `dir` on the document, so Arabic flips the whole layout to `dir="rtl"`. Components
  use logical Tailwind utilities (`ms-auto`, `rtl:-scale-x-100`) and mirror without duplicated styles.
- **Dates and relative times come from `Intl`.** `Intl.RelativeTimeFormat` rather than hand-written
  plural keys — Arabic has six plural categories and the platform already ships the correct forms.
- **Bidi handled deliberately.** Arabic uses Latin digits so technical values line up in a table, and
  compound values like `1–25` are wrapped in Unicode isolates so the bidi algorithm doesn't reorder
  them into `25–1` inside an Arabic sentence.

---

## Conventions

Every source file opens with a `// cypod-telemetry` header. Deliberate trade-offs are marked
`// note:` explaining the *why*. The most notable is the fleet's **N+1 fan-out**: `GET /devices`
returns only identity fields, so each device's latest state is a separate request per poll —
documented in `services/use-fleet.ts` with a server-side `?include=latest` fix noted as the follow-up.
