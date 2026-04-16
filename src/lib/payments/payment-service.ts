import { randomUUID } from 'crypto';
import type Stripe from 'stripe';
import { sql } from '@/lib/db';
import { getStripe } from '@/lib/payments/stripe';
import { paymentsAppBaseUrl } from '@/lib/payments/urls';

/** Inserted before creating a Checkout Session so metadata can reference a stable id. */
export async function insertPendingPayment(input: {
  companyId: string;
  sourceType: 'estimate_deposit' | 'invoice_payment';
  sourceId: string;
  amountCents: number;
  currency?: string;
  customerEmail?: string | null;
  metadata?: Record<string, string>;
}): Promise<string> {
  const id = randomUUID();
  const metaJson = input.metadata ? JSON.stringify(input.metadata) : null;
  await sql`
    INSERT INTO payments (
      id, company_id, source_type, source_id, amount_cents, currency, status, customer_email, metadata_json
    ) VALUES (
      ${id},
      ${input.companyId},
      ${input.sourceType},
      ${input.sourceId},
      ${input.amountCents},
      ${(input.currency || 'usd').toLowerCase()},
      'pending',
      ${input.customerEmail ?? null},
      ${metaJson}
    )
  `;
  return id;
}

export async function attachCheckoutSessionToPayment(
  paymentId: string,
  sessionId: string,
  url: string | null,
): Promise<void> {
  await sql`
    UPDATE payments SET
      stripe_checkout_session_id = ${sessionId},
      payment_url = ${url},
      updated_at = datetime('now')
    WHERE id = ${paymentId}
  `;
}

export async function createEstimateDepositCheckoutSession(input: {
  estimateId: string;
  estimateNumber: string;
  companyId: string;
  token: string;
  amountCents: number;
  customerEmail?: string | null;
}): Promise<{ url: string; paymentId: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: 'Stripe is not configured (missing STRIPE_SECRET_KEY).' };

  const base = paymentsAppBaseUrl();
  const paymentId = await insertPendingPayment({
    companyId: input.companyId,
    sourceType: 'estimate_deposit',
    sourceId: input.estimateId,
    amountCents: input.amountCents,
    customerEmail: input.customerEmail,
    metadata: { estimate_number: input.estimateNumber },
  });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: input.amountCents,
            product_data: {
              name: `Deposit — Estimate ${input.estimateNumber}`,
              description: 'Estimate deposit (applied to your project)',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/estimate/${input.token}/deposit/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/estimate/${input.token}?deposit=cancelled`,
      metadata: {
        payment_id: paymentId,
        company_id: input.companyId,
        source_type: 'estimate_deposit',
        source_id: input.estimateId,
      },
    });
  } catch (e) {
    await sql`UPDATE payments SET status = 'failed', failed_at = datetime('now'), updated_at = datetime('now') WHERE id = ${paymentId}`;
    return { error: e instanceof Error ? e.message : 'Stripe error' };
  }

  await attachCheckoutSessionToPayment(paymentId, session.id, session.url);
  await sql`UPDATE estimates SET deposit_status = 'pending', updated_at = datetime('now') WHERE id = ${input.estimateId}`;
  if (!session.url) return { error: 'Stripe did not return a checkout URL.' };
  return { url: session.url, paymentId };
}

export async function createInvoicePaymentCheckoutSession(input: {
  invoiceId: string;
  invoiceNumber: string;
  companyId: string;
  publicPayToken: string;
  amountCents: number;
  customerEmail?: string | null;
}): Promise<{ url: string; paymentId: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: 'Stripe is not configured (missing STRIPE_SECRET_KEY).' };

  const base = paymentsAppBaseUrl();
  const paymentId = await insertPendingPayment({
    companyId: input.companyId,
    sourceType: 'invoice_payment',
    sourceId: input.invoiceId,
    amountCents: input.amountCents,
    customerEmail: input.customerEmail,
    metadata: { invoice_number: input.invoiceNumber },
  });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: input.amountCents,
            product_data: {
              name: `Invoice ${input.invoiceNumber}`,
              description: 'Payment due',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/pay/invoice/${input.publicPayToken}/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pay/invoice/${input.publicPayToken}?cancelled=1`,
      metadata: {
        payment_id: paymentId,
        company_id: input.companyId,
        source_type: 'invoice_payment',
        source_id: input.invoiceId,
      },
    });
  } catch (e) {
    await sql`UPDATE payments SET status = 'failed', failed_at = datetime('now'), updated_at = datetime('now') WHERE id = ${paymentId}`;
    return { error: e instanceof Error ? e.message : 'Stripe error' };
  }

  await attachCheckoutSessionToPayment(paymentId, session.id, session.url);
  if (!session.url) return { error: 'Stripe did not return a checkout URL.' };
  return { url: session.url, paymentId };
}

async function logEstimateActivity(
  estimateId: string,
  eventType: string,
  payload: Record<string, unknown>,
  actorType: string,
) {
  const aid = randomUUID();
  await sql`
    INSERT INTO estimate_activity (id, estimate_id, event_type, payload_json, actor_type, actor_id)
    VALUES (
      ${aid},
      ${estimateId},
      ${eventType},
      ${JSON.stringify(payload)},
      ${actorType},
      NULL
    )
  `;
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const sessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const rows = await sql`
    SELECT * FROM payments WHERE stripe_checkout_session_id = ${sessionId} LIMIT 1
  `;
  if (!rows.length) return;
  const pay = rows[0] as Record<string, unknown>;
  if (pay.status === 'paid') return;

  await sql`
    UPDATE payments SET
      status = 'paid',
      paid_at = datetime('now'),
      stripe_payment_intent_id = ${paymentIntentId},
      updated_at = datetime('now')
    WHERE id = ${pay.id as string}
  `;

  const sourceType = String(pay.source_type);
  const sourceId = String(pay.source_id);

  if (sourceType === 'estimate_deposit') {
    const estRows = await sql`SELECT status FROM estimates WHERE id = ${sourceId} LIMIT 1`;
    const st = String((estRows[0] as { status?: string } | undefined)?.status || '');
    if (st === 'rejected' || st === 'expired' || st === 'converted') {
      return;
    }
    await sql`
      UPDATE estimates SET
        deposit_status = 'paid',
        deposit_paid_at = datetime('now'),
        status = 'approved',
        approved_at = COALESCE(approved_at, datetime('now')),
        updated_at = datetime('now')
      WHERE id = ${sourceId}
    `;
    await logEstimateActivity(sourceId, 'deposit_paid', { payment_id: pay.id, session_id: sessionId }, 'customer');
    await logEstimateActivity(sourceId, 'approved', { via: 'deposit_checkout' }, 'customer');
    return;
  }

  if (sourceType === 'invoice_payment') {
    const inv = await sql`SELECT status FROM invoices WHERE id = ${sourceId} LIMIT 1`;
    if ((inv[0] as { status?: string } | undefined)?.status === 'paid') return;
    const today = new Date().toISOString().split('T')[0];
    await sql`
      UPDATE invoices SET
        status = 'paid',
        paid_date = ${today},
        updated_at = datetime('now')
      WHERE id = ${sourceId}
    `;
  }
}

export async function markPaymentFailedBySessionId(sessionId: string): Promise<void> {
  await sql`
    UPDATE payments SET status = 'failed', failed_at = datetime('now'), updated_at = datetime('now')
    WHERE stripe_checkout_session_id = ${sessionId} AND status = 'pending'
  `;
}

export async function markPaymentExpiredBySessionId(sessionId: string): Promise<void> {
  await sql`
    UPDATE payments SET status = 'expired', updated_at = datetime('now')
    WHERE stripe_checkout_session_id = ${sessionId} AND status = 'pending'
  `;
}

export async function recordStripeEventProcessed(
  stripeEventId: string,
  eventType: string,
  paymentId: string | null,
  payload: unknown,
): Promise<boolean> {
  const existing = await sql`SELECT 1 FROM payment_events WHERE stripe_event_id = ${stripeEventId} LIMIT 1`;
  if (existing.length) return false;
  const id = randomUUID();
  await sql`
    INSERT INTO payment_events (id, stripe_event_id, event_type, payment_id, payload_json)
    VALUES (
      ${id},
      ${stripeEventId},
      ${eventType},
      ${paymentId},
      ${JSON.stringify(payload)}
    )
  `;
  return true;
}
