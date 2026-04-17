import { randomBytes } from 'crypto';
import { sql } from '@/lib/db';
import { allocateEstimateNumber } from '@/lib/estimates/numbering';
import { runEstimateDelivery, type EstimateDeliveryPayload } from '@/lib/estimates/delivery';
import { calculateEstimateTotals, computeLineTotalCents, type LineForTotals } from '@/lib/estimates/totals';
import type { z } from 'zod';
import type {
  createEstimateBodySchema,
  lineItemBodySchema,
  patchEstimateBodySchema,
  patchLineItemBodySchema,
} from '@/lib/estimates/validation';

async function getDefaultCompanyId(): Promise<string> {
  const rows = await sql`SELECT id FROM companies ORDER BY created_at ASC LIMIT 1`;
  if (rows.length) return rows[0].id as string;
  const ins = await sql`
    INSERT INTO companies (name, email) VALUES ('Demo Company', 'demo@plumberos.com') RETURNING id
  `;
  return (ins[0] as { id: string }).id;
}

export async function logEstimateActivity(
  estimateId: string,
  eventType: string,
  payload: unknown,
  actorType = 'system',
  actorId: string | null = null,
) {
  await sql`
    INSERT INTO estimate_activity (estimate_id, event_type, payload_json, actor_type, actor_id)
    VALUES (${estimateId}, ${eventType}, ${JSON.stringify(payload ?? {})}, ${actorType}, ${actorId})
  `;
}

async function fetchLineRows(estimateId: string): Promise<Record<string, unknown>[]> {
  return sql`
    SELECT * FROM estimate_line_items WHERE estimate_id = ${estimateId} ORDER BY sort_order ASC, created_at ASC
  `;
}

function rowsToLineForTotals(rows: Record<string, unknown>[]): LineForTotals[] {
  return rows.map((r) => ({
    quantity: Number(r.quantity) || 0,
    unit_price_cents: Number(r.unit_price_cents) || 0,
    is_optional: Boolean(r.is_optional),
    is_taxable: Boolean(r.is_taxable),
    included_in_package: Boolean(r.included_in_package ?? 1),
    option_group: (r.option_group as string) || null,
  }));
}

export async function recalculateEstimateTotals(estimateId: string) {
  const est = (
    await sql`SELECT discount_amount_cents, tax_rate_basis_points FROM estimates WHERE id = ${estimateId} LIMIT 1`
  )[0] as Record<string, unknown> | undefined;
  if (!est) return;
  const lines = await fetchLineRows(estimateId);
  const lt = rowsToLineForTotals(lines);
  const settings = (
    await sql`SELECT default_tax_rate_basis_points FROM estimate_settings WHERE id = 'default' LIMIT 1`
  )[0] as Record<string, unknown> | undefined;
  const taxBps =
    est.tax_rate_basis_points != null && est.tax_rate_basis_points !== ''
      ? Number(est.tax_rate_basis_points)
      : Number(settings?.default_tax_rate_basis_points ?? 0);
  const discount = Number(est.discount_amount_cents ?? 0);
  const t = calculateEstimateTotals(lt, discount, taxBps);

  for (const row of lines) {
    const q = Number(row.quantity) || 0;
    const up = Number(row.unit_price_cents) || 0;
    const calc = computeLineTotalCents(q, up);
    if (calc !== Number(row.total_price_cents)) {
      await sql`
        UPDATE estimate_line_items SET total_price_cents = ${calc}, updated_at = datetime('now') WHERE id = ${row.id as string}
      `;
    }
  }

  await sql`
    UPDATE estimates SET
      subtotal_amount_cents = ${t.subtotal_amount_cents},
      tax_amount_cents = ${t.tax_amount_cents},
      total_amount_cents = ${t.total_amount_cents},
      updated_at = datetime('now')
    WHERE id = ${estimateId}
  `;
}

function newPublicToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createEstimate(body: z.infer<typeof createEstimateBodySchema>) {
  const companyId = await getDefaultCompanyId();
  const settings = (
    await sql`SELECT * FROM estimate_settings WHERE id = 'default' LIMIT 1`
  )[0] as Record<string, unknown>;
  const company = (await sql`SELECT * FROM companies WHERE id = ${companyId} LIMIT 1`)[0] as Record<
    string,
    unknown
  >;

  let customerId: string | null = body.customer_id ?? null;
  let leadId: string | null = body.lead_id ?? null;
  let resolvedTitle = body.title || 'Estimate';
  let custName = 'Customer';
  let custEmail: string | null = null;
  let custPhone: string | null = null;
  let serviceAddr: string | null = null;

  if (leadId && !customerId) {
    const lr = await sql`
      SELECT l.*, c.id as cid, c.name as cname, c.email as cemail, c.phone as cphone, c.address as caddr
      FROM leads l LEFT JOIN customers c ON c.id = l.customer_id WHERE l.id = ${leadId} LIMIT 1
    `;
    if (lr.length) {
      const L = lr[0] as Record<string, unknown>;
      customerId = (L.cid as string) || null;
      custName = (L.cname as string) || custName;
      custEmail = (L.cemail as string) || null;
      custPhone = (L.cphone as string) || null;
      serviceAddr = (L.location as string) || (L.caddr as string) || null;
      if (!body.title) {
        resolvedTitle = `Estimate — ${(L.issue as string) || 'Plumbing'}`;
      }
    }
  }

  if (customerId) {
    const cr = (await sql`SELECT * FROM customers WHERE id = ${customerId} LIMIT 1`)[0] as Record<
      string,
      unknown
    > | undefined;
    if (cr) {
      custName = (cr.name as string) || custName;
      custEmail = (cr.email as string) || custEmail;
      custPhone = (cr.phone as string) || custPhone;
      serviceAddr = serviceAddr || (cr.address as string) || null;
    }
  }

  if (body.receptionist_call_id) {
    const rc = (
      await sql`SELECT * FROM receptionist_calls WHERE id = ${body.receptionist_call_id} LIMIT 1`
    )[0] as Record<string, unknown> | undefined;
    if (rc) {
      custName = (rc.caller_name as string) || custName;
      custPhone = (rc.from_phone as string) || custPhone;
      let ex: Record<string, unknown> = {};
      try {
        ex = rc.extracted_json ? (JSON.parse(rc.extracted_json as string) as Record<string, unknown>) : {};
      } catch {
        /* ignore */
      }
      serviceAddr = (ex.address as string) || serviceAddr;
      custEmail = (ex.phone as string) ? custEmail : custEmail;
      if (!body.title) resolvedTitle = `Estimate — ${(ex.issueDescription as string) || 'Plumbing service'}`;
    }
  }

  if (body.job_id) {
    const jr = (
      await sql`
        SELECT j.*, c.name as cname, c.email as cemail, c.phone as cphone, c.address as caddr
        FROM jobs j
        LEFT JOIN customers c ON c.id = j.customer_id
        WHERE j.id = ${body.job_id} LIMIT 1
      `
    )[0] as Record<string, unknown> | undefined;
    if (jr) {
      customerId = customerId || (jr.customer_id as string) || null;
      leadId = leadId || (jr.lead_id as string) || null;
      custName = (jr.cname as string) || custName;
      custEmail = (jr.cemail as string) || custEmail;
      custPhone = (jr.cphone as string) || custPhone;
      serviceAddr = (jr.caddr as string) || serviceAddr;
    }
  }

  const num = allocateEstimateNumber();
  const token = newPublicToken();
  const expDays = Number(settings?.default_expiration_days ?? 14);
  const exp = new Date();
  exp.setDate(exp.getDate() + expDays);
  const expirationIso = exp.toISOString();

  const title = resolvedTitle;
  const optionMode = body.option_presentation_mode || 'single';
  const taxBps =
    body.tax_rate_basis_points != null
      ? body.tax_rate_basis_points
      : (settings?.default_tax_rate_basis_points as number | null) ?? null;

  const ins = await sql`
    INSERT INTO estimates (
      estimate_number, status, title, description, company_id,
      customer_id, lead_id, job_id, receptionist_call_id, source_type, source_id,
      assigned_to_plumber_id,
      currency,
      subtotal_amount_cents, discount_amount_cents, tax_amount_cents, total_amount_cents,
      company_name_snapshot, company_email_snapshot, company_phone_snapshot, company_address_snapshot,
      customer_name_snapshot, customer_email_snapshot, customer_phone_snapshot, service_address_snapshot,
      notes_internal, notes_customer,
      expiration_date, customer_public_token,
      option_presentation_mode, tax_rate_basis_points
    )
    VALUES (
      ${num},
      'draft',
      ${title},
      ${body.description ?? null},
      ${companyId},
      ${customerId},
      ${leadId},
      ${body.job_id ?? null},
      ${body.receptionist_call_id ?? null},
      ${body.source_type ?? null},
      ${body.source_id ?? null},
      ${body.assigned_to_plumber_id ?? null},
      'USD',
      0,
      ${body.discount_amount_cents ?? 0},
      0,
      0,
      ${(company?.name as string) || 'Company'},
      ${(company?.email as string) || null},
      ${(company?.phone as string) || null},
      ${(company?.address as string) || null},
      ${custName},
      ${custEmail},
      ${custPhone},
      ${serviceAddr},
      ${body.notes_internal ?? null},
      ${body.notes_customer ?? null},
      ${expirationIso},
      ${token},
      ${optionMode},
      ${taxBps}
    )
    RETURNING *
  `;
  const row = ins[0] as Record<string, unknown>;
  const id = row.id as string;
  await logEstimateActivity(id, 'created', { estimate_number: num }, 'staff', null);
  return row;
}

async function expireIfNeededById(id: string) {
  const row = (await sql`SELECT id, status, expiration_date FROM estimates WHERE id = ${id}`)[0] as
    | Record<string, unknown>
    | undefined;
  if (!row || !row.expiration_date) return;
  const exp = new Date(row.expiration_date as string).getTime();
  if (Number.isNaN(exp) || Date.now() < exp) return;
  const st = row.status as string;
  if (!['sent', 'viewed', 'draft'].includes(st)) return;
  await sql`
    UPDATE estimates SET status = 'expired', expired_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ${id as string} AND status IN ('sent', 'viewed', 'draft')
  `;
  await logEstimateActivity(id as string, 'expired', { auto: true }, 'system', null);
}

export async function getEstimateInternal(id: string) {
  await expireIfNeededById(id);
  const rows = await sql`
    SELECT e.*,
      c.name AS join_customer_name,
      l.issue AS join_lead_issue,
      j.type AS join_job_type
    FROM estimates e
    LEFT JOIN customers c ON c.id = e.customer_id
    LEFT JOIN leads l ON l.id = e.lead_id
    LEFT JOIN jobs j ON j.id = e.job_id
    WHERE e.id = ${id} AND e.archived_at IS NULL
    LIMIT 1
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

export async function listEstimates(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 50));
  const offset = (page - 1) * limit;
  const companyId = await getDefaultCompanyId();

  let q = sql`
    SELECT e.* FROM estimates e
    WHERE e.company_id = ${companyId} AND e.archived_at IS NULL
  `;
  if (params.status && params.status !== 'all') {
    q = sql`${q} AND e.status = ${params.status}`;
  }
  if (params.search?.trim()) {
    const s = `%${params.search.trim()}%`;
    q = sql`${q} AND (
      e.estimate_number LIKE ${s}
      OR e.customer_name_snapshot LIKE ${s}
      OR e.title LIKE ${s}
    )`;
  }
  const countBase = sql`
    SELECT COUNT(*) as c FROM estimates e
    WHERE e.company_id = ${companyId} AND e.archived_at IS NULL
  `;
  let countQ = countBase;
  if (params.status && params.status !== 'all') {
    countQ = sql`${countQ} AND e.status = ${params.status}`;
  }
  if (params.search?.trim()) {
    const s = `%${params.search.trim()}%`;
    countQ = sql`${countQ} AND (
      e.estimate_number LIKE ${s}
      OR e.customer_name_snapshot LIKE ${s}
      OR e.title LIKE ${s}
    )`;
  }
  const countRow = await countQ;
  const total = Number((countRow[0] as { c: number }).c || 0);
  const rows = await sql`${q} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  return { estimates: rows, total, page, limit };
}

async function applyCustomerToEstimate(estimateId: string, customerId: string | null) {
  if (customerId === null) {
    await sql`
      UPDATE estimates SET
        customer_id = NULL,
        customer_name_snapshot = 'Customer',
        customer_email_snapshot = NULL,
        customer_phone_snapshot = NULL,
        service_address_snapshot = NULL,
        updated_at = datetime('now')
      WHERE id = ${estimateId}
    `;
    return;
  }
  const cr = (await sql`SELECT * FROM customers WHERE id = ${customerId} LIMIT 1`)[0] as
    | Record<string, unknown>
    | undefined;
  if (!cr) throw new Error('Customer not found');
  const name = String(cr.name || 'Customer');
  const email = (cr.email as string) || null;
  const phone = (cr.phone as string) || null;
  const addr = (cr.address as string) || null;
  await sql`
    UPDATE estimates SET
      customer_id = ${customerId},
      customer_name_snapshot = ${name},
      customer_email_snapshot = ${email},
      customer_phone_snapshot = ${phone},
      service_address_snapshot = ${addr},
      updated_at = datetime('now')
    WHERE id = ${estimateId}
  `;
}

export async function patchEstimate(id: string, patch: z.infer<typeof patchEstimateBodySchema>) {
  const existing = await getEstimateInternal(id);
  if (!existing) throw new Error('Estimate not found');
  if (['converted', 'archived'].includes(existing.status as string)) {
    throw new Error('Cannot edit converted or archived estimate');
  }
  if (
    existing.status === 'approved' &&
    (patch.discount_amount_cents !== undefined ||
      patch.title !== undefined ||
      patch.customer_id !== undefined)
  ) {
    throw new Error('Approved estimates cannot be edited; duplicate to revise');
  }

  if (patch.title !== undefined) {
    await sql`UPDATE estimates SET title = ${patch.title}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.description !== undefined) {
    await sql`UPDATE estimates SET description = ${patch.description}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.notes_internal !== undefined) {
    await sql`UPDATE estimates SET notes_internal = ${patch.notes_internal}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.notes_customer !== undefined) {
    await sql`UPDATE estimates SET notes_customer = ${patch.notes_customer}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.discount_amount_cents !== undefined) {
    await sql`UPDATE estimates SET discount_amount_cents = ${patch.discount_amount_cents}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.expiration_date !== undefined) {
    await sql`UPDATE estimates SET expiration_date = ${patch.expiration_date}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.assigned_to_plumber_id !== undefined) {
    await sql`UPDATE estimates SET assigned_to_plumber_id = ${patch.assigned_to_plumber_id}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.option_presentation_mode !== undefined) {
    await sql`UPDATE estimates SET option_presentation_mode = ${patch.option_presentation_mode}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.tax_rate_basis_points !== undefined) {
    await sql`UPDATE estimates SET tax_rate_basis_points = ${patch.tax_rate_basis_points}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.deposit_amount_cents !== undefined) {
    await sql`UPDATE estimates SET deposit_amount_cents = ${patch.deposit_amount_cents}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.status !== undefined) {
    await sql`UPDATE estimates SET status = ${patch.status}, updated_at = datetime('now') WHERE id = ${id}`;
  }
  if (patch.customer_id !== undefined) {
    await applyCustomerToEstimate(id, patch.customer_id);
  }

  await recalculateEstimateTotals(id);
  await logEstimateActivity(id, 'updated', patch, 'staff', null);
  return getEstimateInternal(id);
}

export async function archiveEstimate(id: string) {
  await sql`UPDATE estimates SET archived_at = datetime('now'), status = 'archived', updated_at = datetime('now') WHERE id = ${id}`;
  await logEstimateActivity(id, 'archived', {}, 'staff', null);
}

export async function addLineItem(estimateId: string, body: z.infer<typeof lineItemBodySchema>) {
  const existing = await getEstimateInternal(estimateId);
  if (!existing) throw new Error('Estimate not found');
  if (['approved', 'rejected', 'converted', 'expired', 'archived'].includes(existing.status as string)) {
    throw new Error('Cannot edit line items for this status');
  }
  const maxRow = await sql`SELECT MAX(sort_order) as m FROM estimate_line_items WHERE estimate_id = ${estimateId}`;
  const nextOrder = Number((maxRow[0] as { m: number | null })?.m ?? -1) + 1;
  const sortOrder = body.sort_order ?? nextOrder;
  const qty = body.quantity;
  const up = body.unit_price_cents;
  const total = computeLineTotalCents(qty, up);
  const ins = await sql`
    INSERT INTO estimate_line_items (
      estimate_id, sort_order, category, name, description, quantity, unit,
      unit_price_cents, total_price_cents, is_optional, is_taxable, option_group, included_in_package
    )
    VALUES (
      ${estimateId},
      ${sortOrder},
      ${body.category ?? null},
      ${body.name},
      ${body.description ?? null},
      ${qty},
      ${body.unit},
      ${up},
      ${total},
      ${body.is_optional ? 1 : 0},
      ${body.is_taxable === false ? 0 : 1},
      ${body.option_group ?? null},
      ${body.included_in_package === false ? 0 : 1}
    )
    RETURNING *
  `;
  await recalculateEstimateTotals(estimateId);
  await logEstimateActivity(estimateId, 'line_item_added', { line_id: (ins[0] as { id: string }).id }, 'staff', null);
  return ins[0];
}

export async function updateLineItem(
  estimateId: string,
  lineId: string,
  patch: z.infer<typeof patchLineItemBodySchema>,
) {
  const existing = await getEstimateInternal(estimateId);
  if (!existing) throw new Error('Estimate not found');
  if (['approved', 'rejected', 'converted', 'expired', 'archived'].includes(existing.status as string)) {
    throw new Error('Cannot edit line items');
  }
  const line = (await sql`SELECT * FROM estimate_line_items WHERE id = ${lineId} AND estimate_id = ${estimateId}`)[0] as
    | Record<string, unknown>
    | undefined;
  if (!line) throw new Error('Line item not found');

  const category = patch.category !== undefined ? patch.category : (line.category as string | null);
  const name = patch.name ?? (line.name as string);
  const description = patch.description !== undefined ? patch.description : (line.description as string | null);
  const qty = patch.quantity ?? Number(line.quantity);
  const unit = patch.unit ?? (line.unit as string);
  const up = patch.unit_price_cents ?? Number(line.unit_price_cents);
  const isOpt = patch.is_optional !== undefined ? patch.is_optional : Boolean(line.is_optional);
  const isTax = patch.is_taxable !== undefined ? patch.is_taxable : Boolean(line.is_taxable);
  const optG = patch.option_group !== undefined ? patch.option_group : (line.option_group as string | null);
  const inc = patch.included_in_package !== undefined ? patch.included_in_package : Boolean(line.included_in_package ?? 1);
  const total = computeLineTotalCents(qty, up);

  await sql`
    UPDATE estimate_line_items SET
      category = ${category},
      name = ${name},
      description = ${description},
      quantity = ${qty},
      unit = ${unit},
      unit_price_cents = ${up},
      total_price_cents = ${total},
      is_optional = ${isOpt ? 1 : 0},
      is_taxable = ${isTax ? 1 : 0},
      option_group = ${optG},
      included_in_package = ${inc ? 1 : 0},
      updated_at = datetime('now')
    WHERE id = ${lineId} AND estimate_id = ${estimateId}
  `;
  await recalculateEstimateTotals(estimateId);
  await logEstimateActivity(estimateId, 'line_item_updated', { line_id: lineId }, 'staff', null);
}

export async function deleteLineItem(estimateId: string, lineId: string) {
  await sql`DELETE FROM estimate_line_items WHERE id = ${lineId} AND estimate_id = ${estimateId}`;
  await recalculateEstimateTotals(estimateId);
  await logEstimateActivity(estimateId, 'line_item_deleted', { line_id: lineId }, 'staff', null);
}

export async function reorderLineItems(estimateId: string, orderedIds: string[]) {
  let i = 0;
  for (const lid of orderedIds) {
    await sql`UPDATE estimate_line_items SET sort_order = ${i}, updated_at = datetime('now') WHERE id = ${lid} AND estimate_id = ${estimateId}`;
    i += 1;
  }
  await logEstimateActivity(estimateId, 'line_items_reordered', { order: orderedIds }, 'staff', null);
}

function publicBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3001').replace(
    /\/$/,
    '',
  );
}

export function buildPublicEstimateUrl(token: string) {
  return `${publicBaseUrl()}/estimate/${token}`;
}

export async function sendEstimate(
  estimateId: string,
  opts: { recipient_email?: string; delivery_type?: string },
) {
  const row = await getEstimateInternal(estimateId);
  if (!row) throw new Error('Estimate not found');
  if (row.status === 'converted') throw new Error('Already converted');

  const url = buildPublicEstimateUrl(row.customer_public_token as string);
  const manualLink = opts.delivery_type === 'manual_copy_link' || opts.delivery_type === 'sms_share_link';

  const recipient =
    opts.recipient_email ||
    (row.customer_email_snapshot as string) ||
    (manualLink ? 'link-only@local.invalid' : null);
  if (!recipient) {
    throw new Error('No recipient email; set customer email, pass recipient_email, or use manual_copy_link');
  }

  const payload: EstimateDeliveryPayload = {
    estimateId,
    estimateNumber: row.estimate_number as string,
    recipient,
    customerName: (row.customer_name_snapshot as string) || 'Customer',
    title: (row.title as string) || 'Estimate',
    totalCents: Number(row.total_amount_cents ?? 0),
    currency: (row.currency as string) || 'USD',
    publicUrl: url,
    expirationDate: (row.expiration_date as string) || null,
  };

  let deliveryId: string;
  let outcome: { provider: string; ok: boolean; subject?: string; bodyText?: string };
  if (manualLink) {
    const ins = await sql`
      INSERT INTO estimate_delivery (
        estimate_id, delivery_type, recipient, subject, body_snapshot, provider,
        status, public_link, sent_at
      )
      VALUES (
        ${estimateId},
        ${opts.delivery_type || 'manual_copy_link'},
        ${recipient},
        ${`Estimate ${row.estimate_number}`},
        ${`Share link: ${url}`},
        'mock',
        'sent',
        ${url},
        ${new Date().toISOString()}
      )
      RETURNING id
    `;
    deliveryId = (ins[0] as { id: string }).id;
    outcome = { provider: 'mock', ok: true, subject: `Estimate ${row.estimate_number}`, bodyText: url };
  } else {
    const run = await runEstimateDelivery(payload);
    deliveryId = run.deliveryId;
    outcome = run.outcome;
  }

  await sql`
    UPDATE estimates SET
      status = 'sent',
      sent_at = COALESCE(sent_at, datetime('now')),
      updated_at = datetime('now')
    WHERE id = ${estimateId}
  `;

  const prevStatus = row.status as string;
  const eventType = prevStatus === 'sent' || prevStatus === 'viewed' ? 'resent' : 'sent';
  await logEstimateActivity(
    estimateId,
    eventType,
    { delivery_id: deliveryId, provider: outcome.provider, recipient },
    'staff',
    null,
  );
  return { deliveryId, outcome, publicUrl: url };
}

export async function getEstimatePublicByToken(token: string) {
  const rows = await sql`
    SELECT * FROM estimates WHERE customer_public_token = ${token} AND archived_at IS NULL LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  if (row.status === 'draft') return null;
  await expireIfNeededById(row.id as string);
  const again = (await sql`SELECT * FROM estimates WHERE customer_public_token = ${token} LIMIT 1`)[0] as Record<
    string,
    unknown
  >;
  return again;
}

export async function markPublicViewed(token: string) {
  const row = await getEstimatePublicByToken(token);
  if (!row) return null;
  if (row.status === 'draft') return row;
  const first = !row.viewed_at;
  if (first) {
    await sql`
      UPDATE estimates SET
        viewed_at = datetime('now'),
        status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END,
        updated_at = datetime('now')
      WHERE customer_public_token = ${token}
    `;
    await logEstimateActivity(row.id as string, 'viewed', { public: true }, 'customer', null);
    await logEstimateActivity(row.id as string, 'public_link_opened', {}, 'customer', null);
  }
  return (await sql`SELECT * FROM estimates WHERE customer_public_token = ${token}`)[0];
}

export function sanitizeEstimateForPublic(row: Record<string, unknown>) {
  const {
    notes_internal: _ni,
    created_by_plumber_id: _cb,
    assigned_to_plumber_id: _ab,
    archived_at: _ar,
    customer_public_token: _tok,
    company_id: _cid,
    lead_id: _lid,
    job_id: _jid,
    receptionist_call_id: _rc,
    source_type: _st,
    source_id: _sid,
    prior_estimate_id: _pe,
    id: _id,
    ...rest
  } = row;
  void _ni;
  void _cb;
  void _ab;
  void _ar;
  void _tok;
  void _cid;
  void _lid;
  void _jid;
  void _rc;
  void _st;
  void _sid;
  void _pe;
  void _id;
  return rest;
}

export async function approvePublicEstimate(
  token: string,
  body: { customer_selected_option_group?: string | null; confirmation_acknowledged?: boolean; signature_text?: string | null },
) {
  const row = await getEstimatePublicByToken(token);
  if (!row) throw new Error('Not found');
  if (['approved', 'rejected', 'expired', 'converted', 'draft', 'archived'].includes(row.status as string)) {
    if (row.status === 'approved') return row;
    throw new Error(`Cannot approve from status ${row.status}`);
  }
  const settings = (await sql`SELECT * FROM estimate_settings WHERE id = 'default'`)[0] as Record<string, unknown>;
  if (Number(settings?.customer_signature_required ?? 1) === 1 && !body.confirmation_acknowledged) {
    throw new Error('Confirmation required to approve');
  }
  if (row.option_presentation_mode === 'tiered' && !body.customer_selected_option_group?.trim()) {
    throw new Error('Please select an option package before approving');
  }
  await sql`
    UPDATE estimates SET
      status = 'approved',
      approved_at = datetime('now'),
      customer_selected_option_group = ${body.customer_selected_option_group ?? null},
      updated_at = datetime('now')
    WHERE customer_public_token = ${token}
  `;
  await logEstimateActivity(row.id as string, 'approved', { ...body, public: true }, 'customer', null);
  return (await sql`SELECT * FROM estimates WHERE id = ${row.id as string}`)[0];
}

export async function rejectPublicEstimate(token: string, body: { reason?: string | null }) {
  const settings = (await sql`SELECT allow_customer_reject FROM estimate_settings WHERE id = 'default'`)[0] as
    | Record<string, unknown>
    | undefined;
  if (settings && Number(settings.allow_customer_reject ?? 1) === 0) throw new Error('Rejection not enabled');
  const row = await getEstimatePublicByToken(token);
  if (!row) throw new Error('Not found');
  if (!['sent', 'viewed'].includes(row.status as string)) throw new Error('Cannot reject');
  await sql`
    UPDATE estimates SET status = 'rejected', rejected_at = datetime('now'), updated_at = datetime('now')
    WHERE customer_public_token = ${token}
  `;
  await logEstimateActivity(row.id as string, 'rejected', { ...body, public: true }, 'customer', null);
  return (await sql`SELECT * FROM estimates WHERE id = ${row.id as string}`)[0];
}

export async function approveManually(id: string) {
  const row = await getEstimateInternal(id);
  if (!row) throw new Error('Not found');
  if (row.status === 'converted') throw new Error('Already converted');
  await sql`
    UPDATE estimates SET status = 'approved', approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ${id}
  `;
  await logEstimateActivity(id, 'approved', { manual: true }, 'staff', null);
}

export async function rejectManually(id: string) {
  await sql`
    UPDATE estimates SET status = 'rejected', rejected_at = datetime('now'), updated_at = datetime('now') WHERE id = ${id}
  `;
  await logEstimateActivity(id, 'rejected', { manual: true }, 'staff', null);
}

export async function convertEstimateToJob(estimateId: string) {
  const row = await getEstimateInternal(estimateId);
  if (!row) throw new Error('Not found');
  if (row.converted_to_job_id) throw new Error('Already converted to job');
  if (row.status !== 'approved') throw new Error('Estimate must be approved');

  const companyId = row.company_id as string;
  const lines = await fetchLineRows(estimateId);
  const opt = row.customer_selected_option_group as string | null;
  const lineSummary = lines
    .filter((l) => {
      if (!opt || !l.option_group) return true;
      return (l.option_group as string) === opt || l.option_group === '_default';
    })
    .map((l) => `${l.name as string} x${l.quantity}`)
    .join('; ');

  const desc = `${row.title as string}\n${lineSummary}`.slice(0, 8000);
  const total = Number(row.total_amount_cents ?? 0) / 100;
  const jobNotes = [row.notes_customer as string | null, row.notes_internal as string | null]
    .filter(Boolean)
    .join('\n---\n')
    .slice(0, 8000);

  const ins = await sql`
    INSERT INTO jobs (
      company_id, lead_id, customer_id, plumber_id, status, type, description,
      estimated_price, notes, source_estimate_id
    )
    VALUES (
      ${companyId},
      ${row.lead_id as string | null},
      ${row.customer_id as string | null},
      ${row.assigned_to_plumber_id as string | null},
      'scheduled',
      'Estimate approved work',
      ${desc},
      ${total},
      ${jobNotes || null},
      ${estimateId}
    )
    RETURNING id
  `;
  const jobId = (ins[0] as { id: string }).id;

  await sql`
    UPDATE estimates SET
      status = 'converted',
      converted_to_job_id = ${jobId},
      updated_at = datetime('now')
    WHERE id = ${estimateId}
  `;
  await logEstimateActivity(estimateId, 'converted_to_job', { job_id: jobId }, 'staff', null);
  return { jobId };
}

export async function duplicateEstimate(id: string) {
  const row = await getEstimateInternal(id);
  if (!row) throw new Error('Not found');
  const num = allocateEstimateNumber();
  const token = newPublicToken();
  const ver = Number(row.version_number ?? 1) + 1;

  const ins = await sql`
    INSERT INTO estimates (
      estimate_number, status, title, description, company_id,
      customer_id, lead_id, job_id, receptionist_call_id,
      assigned_to_plumber_id,
      currency,
      subtotal_amount_cents, discount_amount_cents, tax_amount_cents, total_amount_cents, deposit_amount_cents,
      company_name_snapshot, company_email_snapshot, company_phone_snapshot, company_address_snapshot,
      customer_name_snapshot, customer_email_snapshot, customer_phone_snapshot, service_address_snapshot,
      notes_internal, notes_customer,
      expiration_date, customer_public_token,
      version_number, prior_estimate_id,
      option_presentation_mode, tax_rate_basis_points
    )
    SELECT
      ${num},
      'draft',
      title || ' (copy)',
      description,
      company_id,
      customer_id, lead_id, job_id, receptionist_call_id,
      assigned_to_plumber_id,
      currency,
      subtotal_amount_cents, discount_amount_cents, tax_amount_cents, total_amount_cents, deposit_amount_cents,
      company_name_snapshot, company_email_snapshot, company_phone_snapshot, company_address_snapshot,
      customer_name_snapshot, customer_email_snapshot, customer_phone_snapshot, service_address_snapshot,
      notes_internal, notes_customer,
      expiration_date,
      ${token},
      ${ver},
      ${id},
      option_presentation_mode, tax_rate_basis_points
    FROM estimates WHERE id = ${id}
    RETURNING id
  `;
  const newId = (ins[0] as { id: string }).id;

  const lines = await sql`SELECT * FROM estimate_line_items WHERE estimate_id = ${id}`;
  for (const l of lines as Record<string, unknown>[]) {
    await sql`
      INSERT INTO estimate_line_items (
        estimate_id, sort_order, category, name, description, quantity, unit,
        unit_price_cents, total_price_cents, is_optional, is_taxable, option_group, included_in_package
      )
      VALUES (
        ${newId},
        ${l.sort_order},
        ${l.category},
        ${l.name},
        ${l.description},
        ${l.quantity},
        ${l.unit},
        ${l.unit_price_cents},
        ${l.total_price_cents},
        ${l.is_optional},
        ${l.is_taxable},
        ${l.option_group},
        ${l.included_in_package}
      )
    `;
  }
  await recalculateEstimateTotals(newId);
  await logEstimateActivity(newId, 'created', { duplicated_from: id, version: ver }, 'staff', null);
  return getEstimateInternal(newId);
}

export async function getActivity(estimateId: string) {
  return sql`SELECT * FROM estimate_activity WHERE estimate_id = ${estimateId} ORDER BY created_at ASC`;
}

export async function getDeliveries(estimateId: string) {
  return sql`SELECT * FROM estimate_delivery WHERE estimate_id = ${estimateId} ORDER BY created_at DESC`;
}

export async function getEstimateSettings() {
  const rows = await sql`SELECT * FROM estimate_settings WHERE id = 'default'`;
  return rows[0] as Record<string, unknown>;
}

export async function patchEstimateSettings(patch: Record<string, unknown>) {
  if (patch.company_name !== undefined) {
    await sql`UPDATE estimate_settings SET company_name = ${String(patch.company_name)}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.logo_url !== undefined) {
    await sql`UPDATE estimate_settings SET logo_url = ${patch.logo_url as string | null}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.accent_color !== undefined) {
    await sql`UPDATE estimate_settings SET accent_color = ${patch.accent_color as string | null}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.estimate_footer_text !== undefined) {
    await sql`UPDATE estimate_settings SET estimate_footer_text = ${patch.estimate_footer_text as string | null}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.default_terms_text !== undefined) {
    await sql`UPDATE estimate_settings SET default_terms_text = ${patch.default_terms_text as string | null}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.default_expiration_days !== undefined) {
    await sql`UPDATE estimate_settings SET default_expiration_days = ${Number(patch.default_expiration_days)}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.default_tax_rate_basis_points !== undefined) {
    await sql`UPDATE estimate_settings SET default_tax_rate_basis_points = ${patch.default_tax_rate_basis_points as number | null}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.estimate_prefix !== undefined) {
    await sql`UPDATE estimate_settings SET estimate_prefix = ${String(patch.estimate_prefix)}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.default_deposit_enabled !== undefined) {
    await sql`UPDATE estimate_settings SET default_deposit_enabled = ${patch.default_deposit_enabled ? 1 : 0}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.default_deposit_percent_basis_points !== undefined) {
    await sql`UPDATE estimate_settings SET default_deposit_percent_basis_points = ${patch.default_deposit_percent_basis_points as number | null}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.customer_signature_required !== undefined) {
    await sql`UPDATE estimate_settings SET customer_signature_required = ${patch.customer_signature_required ? 1 : 0}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.allow_customer_reject !== undefined) {
    await sql`UPDATE estimate_settings SET allow_customer_reject = ${patch.allow_customer_reject ? 1 : 0}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  if (patch.public_approval_requires_token !== undefined) {
    await sql`UPDATE estimate_settings SET public_approval_requires_token = ${patch.public_approval_requires_token ? 1 : 0}, updated_at = datetime('now') WHERE id = 'default'`;
  }
  return getEstimateSettings();
}

export async function getEstimateDashboardStats() {
  const companyId = await getDefaultCompanyId();
  const rows = await sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_c,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_c,
      SUM(CASE WHEN status = 'viewed' THEN 1 ELSE 0 END) as viewed_c,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_c,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_c,
      SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_c,
      SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_c,
      SUM(total_amount_cents) as total_value_cents
    FROM estimates
    WHERE company_id = ${companyId} AND archived_at IS NULL
  `;
  const r = rows[0] as Record<string, unknown>;
  const sent = Number(r.sent_c || 0) + Number(r.viewed_c || 0);
  const approved = Number(r.approved_c || 0) + Number(r.converted_c || 0);
  const approvalRate = sent > 0 ? approved / sent : 0;
  return {
    total: Number(r.total || 0),
    draft: Number(r.draft_c || 0),
    sent: Number(r.sent_c || 0),
    viewed: Number(r.viewed_c || 0),
    approved: Number(r.approved_c || 0),
    rejected: Number(r.rejected_c || 0),
    expired: Number(r.expired_c || 0),
    converted: Number(r.converted_c || 0),
    totalValueCents: Number(r.total_value_cents || 0),
    approvalRate,
  };
}

export function buildEstimatePresentation(row: Record<string, unknown>, lines: Record<string, unknown>[]) {
  return {
    estimate: row,
    lineItems: lines,
    formatted: {
      subtotal: (Number(row.subtotal_amount_cents) / 100).toFixed(2),
      tax: (Number(row.tax_amount_cents) / 100).toFixed(2),
      discount: (Number(row.discount_amount_cents) / 100).toFixed(2),
      total: (Number(row.total_amount_cents) / 100).toFixed(2),
    },
  };
}

export async function getEstimateAdminDetail(id: string) {
  const est = await getEstimateInternal(id);
  if (!est) return null;
  const lines = await fetchLineRows(id);
  const activity = await getActivity(id);
  const deliveries = await getDeliveries(id);
  const presentation = buildEstimatePresentation(est, lines);
  return { estimate: est, lines, activity, deliveries, presentation };
}

export async function getCustomerEstimatePageData(token: string) {
  await markPublicViewed(token);
  const row = await getEstimatePublicByToken(token);
  if (!row) return null;
  const lines = await fetchLineRows(row.id as string);
  const branding = (
    await sql`
      SELECT company_name, logo_url, accent_color, estimate_footer_text, default_terms_text,
        allow_customer_reject
      FROM estimate_settings WHERE id = 'default' LIMIT 1
    `
  )[0] as Record<string, unknown>;
  return {
    estimate: sanitizeEstimateForPublic(row),
    lines,
    branding: branding || {},
  };
}
