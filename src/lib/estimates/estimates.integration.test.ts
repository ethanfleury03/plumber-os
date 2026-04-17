import { randomUUID } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const dbPath = path.join(os.tmpdir(), `plumberos-est-${randomUUID()}.db`);
process.env.SQLITE_PATH = dbPath;

describe('estimates service (sqlite)', () => {
  let createEstimate: typeof import('@/lib/estimates/service').createEstimate;
  let addLineItem: typeof import('@/lib/estimates/service').addLineItem;
  let getEstimateInternal: typeof import('@/lib/estimates/service').getEstimateInternal;
  let sendEstimate: typeof import('@/lib/estimates/service').sendEstimate;
  let approvePublicEstimate: typeof import('@/lib/estimates/service').approvePublicEstimate;
  let rejectPublicEstimate: typeof import('@/lib/estimates/service').rejectPublicEstimate;
  let convertEstimateToJob: typeof import('@/lib/estimates/service').convertEstimateToJob;
  let duplicateEstimate: typeof import('@/lib/estimates/service').duplicateEstimate;
  let sql: typeof import('@/lib/db').sql;
  let getCustomerEstimatePageData: typeof import('@/lib/estimates/service').getCustomerEstimatePageData;

  beforeAll(async () => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const dbMod = await import('@/lib/db');
    sql = dbMod.sql;
    const svc = await import('@/lib/estimates/service');
    createEstimate = svc.createEstimate;
    addLineItem = svc.addLineItem;
    getEstimateInternal = svc.getEstimateInternal;
    sendEstimate = svc.sendEstimate;
    approvePublicEstimate = svc.approvePublicEstimate;
    rejectPublicEstimate = svc.rejectPublicEstimate;
    convertEstimateToJob = svc.convertEstimateToJob;
    duplicateEstimate = svc.duplicateEstimate;
    getCustomerEstimatePageData = svc.getCustomerEstimatePageData;

    await sql`INSERT INTO companies (id, name, email) VALUES (${randomUUID()}, 'Test Co', 'test@example.com')`;
  });

  afterAll(() => {
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* ignore */
    }
  });

  it('creates estimate with line items and recalculates totals', async () => {
    const est = await createEstimate({ title: 'Pipe repair' });
    const id = est.id as string;
    await addLineItem(id, {
      name: 'Labor',
      quantity: 2,
      unit: 'hr',
      unit_price_cents: 12500,
      is_taxable: true,
    });
    await addLineItem(id, {
      name: 'Parts',
      quantity: 1,
      unit: 'ea',
      unit_price_cents: 4500,
      is_taxable: true,
    });
    const row = await getEstimateInternal(id);
    expect(Number(row?.subtotal_amount_cents)).toBe(29500);
    expect(Number(row?.total_amount_cents)).toBeGreaterThan(0);
  });

  it('send (manual link) and public data does not expose internal ids', async () => {
    const est = await createEstimate({ title: 'Drain' });
    const id = est.id as string;
    await addLineItem(id, {
      name: 'Clearing',
      quantity: 1,
      unit: 'ea',
      unit_price_cents: 9900,
    });
    const before = await getEstimateInternal(id);
    const token = before?.customer_public_token as string;
    await sendEstimate(id, { delivery_type: 'manual_copy_link' });
    const pub = await getCustomerEstimatePageData(token);
    expect(pub).not.toBeNull();
    expect(pub?.estimate).not.toHaveProperty('notes_internal');
    expect(pub?.estimate).not.toHaveProperty('id');
    expect(pub?.estimate).not.toHaveProperty('customer_public_token');
  });

  it('public approve and convert to job; duplicate conversion fails', async () => {
    const est = await createEstimate({
      title: 'WH',
      option_presentation_mode: 'single',
    });
    const id = est.id as string;
    await addLineItem(id, {
      name: 'Tank',
      quantity: 1,
      unit: 'ea',
      unit_price_cents: 80000,
    });
    const row = await getEstimateInternal(id);
    const token = row?.customer_public_token as string;
    await sendEstimate(id, { delivery_type: 'manual_copy_link' });
    await approvePublicEstimate(token, { confirmation_acknowledged: true });
    const { jobId } = await convertEstimateToJob(id);
    expect(jobId).toBeTruthy();
    await expect(convertEstimateToJob(id)).rejects.toThrow(/Already converted to job/);
  });

  it('public reject flow', async () => {
    const est = await createEstimate({ title: 'Small job' });
    const id = est.id as string;
    await addLineItem(id, {
      name: 'Fee',
      quantity: 1,
      unit: 'ea',
      unit_price_cents: 5000,
    });
    const token = (await getEstimateInternal(id))?.customer_public_token as string;
    await sendEstimate(id, { delivery_type: 'manual_copy_link' });
    await rejectPublicEstimate(token, { reason: 'too high' });
    const again = await getEstimateInternal(id);
    expect(again?.status).toBe('rejected');
  });

  it('duplicate increments version and copies lines', async () => {
    const est = await createEstimate({ title: 'Original' });
    const id = est.id as string;
    await addLineItem(id, {
      name: 'Line',
      quantity: 1,
      unit: 'ea',
      unit_price_cents: 100,
    });
    const dup = await duplicateEstimate(id);
    expect(Number(dup?.version_number)).toBeGreaterThan(Number(est.version_number));
    const lines = await sql`SELECT * FROM estimate_line_items WHERE estimate_id = ${dup?.id as string}`;
    expect(lines.length).toBe(1);
  });
});
