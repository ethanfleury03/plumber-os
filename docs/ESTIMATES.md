# Estimates / quotes

PlumberOS **Estimates** let you build line-item quotes, share a secure customer link, collect approval or rejection, and convert an approved estimate into a **job** (with `jobs.source_estimate_id` set).

## Internal UI

- **Sidebar → Estimates** — list, search, status filters, dashboard stats.
- **New estimate** — `/estimates/new` (optional query params: `lead_id`, `customer_id`, `job_id`, `receptionist_call_id`). Use the **CRM customer** search to attach a customer from `/api/customers` to the quote before creating.
- **Editor** — `/estimates/[id]`: attach or change the CRM customer (snapshots refresh from the customer record), full line-item **edit** (pencil) / delete / add, totals, send/copy link, **Archive**, activity, deliveries, convert to job.
- **Settings** — `/estimates/settings`: display name, numbering prefix, tax/expiration defaults, terms/footer, customer approval options.

## Customer (public) page

- URL: `/estimate/[token]` where `token` is the estimate’s `customer_public_token` (opaque hex).
- Draft estimates are **not** visible on the public page until sent (status moves to `sent` via **Send** or **Copy link**).
- **Print / Save PDF**: use the browser print dialog on the public page (print hides action buttons).

## APIs

- Internal: `/api/estimates`, `/api/estimates/[id]`, line items, send, duplicate, manual approve/reject, convert-to-job, activity, stats, settings.
- Public: `GET /api/public/estimates/[token]`, `POST .../approve`, `POST .../reject`, `POST .../viewed`.

## Delivery / email

- **`ESTIMATE_DELIVERY_PROVIDER`**: `mock` (default, records delivery + link), `console` (logs), `email_stub` (records intent; no SMTP wired yet).
- **Send** creates an `estimate_delivery` row and sets status to `sent`. Resends log `resent` in activity.
- **Copy link** uses `manual_copy_link` delivery type and copies the public URL.

## Public base URL for links in emails/logs

Set one of:

- `NEXT_PUBLIC_APP_BASE_URL` (e.g. `https://app.yourcompany.com`)
- `APP_BASE_URL`

Fallback in code: `http://localhost:3001` (dev server port for this repo).

## Estimate numbers

- Stored in `estimate_settings`: `estimate_prefix` + `next_sequence`.
- Format: `{prefix}-{year}-{seq}` (e.g. `EST-2026-1000`), allocated in a SQLite transaction so sequence increments are safe for a single-writer app server.

## Schema

- Tables: `estimate_settings`, `estimates`, `estimate_line_items`, `estimate_activity`, `estimate_delivery`.
- `jobs.source_estimate_id` links a job back to the estimate that created it.
- Fresh installs: see `data/schema.sqlite.sql`. Existing DBs: migrations in `src/lib/estimates/sqlite-migrate.ts` (applied from `getDb()`).

## Tests

- `src/lib/estimates/totals.test.ts` — money math.
- `src/lib/estimates/estimates.integration.test.ts` — SQLite flows (isolated temp DB via `SQLITE_PATH`).

## SQLite `uuid()` helper

The app registers `uuid()` on the SQLite connection (`src/lib/db.ts`) for `DEFAULT (uuid())` columns. If you open the DB outside the app, defaults that call `uuid()` will not work unless you register the same function.
