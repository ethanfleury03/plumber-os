# Estimates / Quotes module

## What it does

Office staff and technicians can build line-item estimates, preview a customer-facing page, send or share a secure link, track status (draft through converted), and turn an approved estimate into a job. Activity and delivery rows record the timeline.

## Creating and editing

1. Open **Estimates** in the sidebar (or use **New estimate** from a lead or receptionist call where linked).
2. Create from blank or with query params: `lead_id`, `customer_id`, `job_id`, `receptionist_call_id` on `/estimates/new`.
3. Add line items (optional **option_group** for good/better/best style packaging). Totals are recalculated on the server.

## Sending and mock email

- **Environment:** `ESTIMATE_DELIVERY_PROVIDER` — `mock` (default), `console`, or `email` / `email_stub` depending on `src/lib/estimates/delivery.ts`.
- **Public link base:** `APP_BASE_URL` or `NEXT_PUBLIC_APP_BASE_URL` (fallback `http://localhost:3001`) for links in copy/email bodies.
- With no real SMTP configured, the mock/console providers still create **estimate_delivery** rows and a shareable URL (`/estimate/[token]`).

## Customer approval

Customers open `/estimate/[token]` (unguessable token). First meaningful view can move status toward **viewed**. Approve/reject POST handlers validate the token. Internal notes are never shown on the public page.

## Converting to a job

Only **approved** estimates convert once; **converted_to_job_id** and `jobs.source_estimate_id` link the records. Duplicate an estimate to revise after approval.

## Estimate numbers

Per company and calendar year, sequence rows in **estimate_number_sequences** allocate the next id inside a transaction. Display format is `{prefix}-{year}-{seq}` (prefix from **estimate_settings**).

## Tests

See `src/lib/estimates/estimates.test.ts` for totals, transitions, public flows, send mock, duplicate, and convert guards.
