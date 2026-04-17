import { sql } from '@/lib/db';

export type DeliveryProviderName = 'mock' | 'console' | 'email_stub';

export interface EstimateDeliveryPayload {
  estimateId: string;
  estimateNumber: string;
  recipient: string;
  customerName: string;
  title: string;
  totalCents: number;
  currency: string;
  publicUrl: string;
  expirationDate: string | null;
}

export interface DeliveryOutcome {
  ok: boolean;
  provider: DeliveryProviderName;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  subject: string;
  bodyText: string;
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(cents / 100);
}

export function buildEstimateEmailContent(p: EstimateDeliveryPayload): { subject: string; bodyText: string } {
  const subject = `Estimate ${p.estimateNumber} — ${p.title}`;
  const exp = p.expirationDate
    ? `This estimate expires on ${new Date(p.expirationDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}.`
    : 'Please review at your earliest convenience.';
  const bodyText = `Hi ${p.customerName},

Please review your plumbing estimate (${p.estimateNumber}) from our team.

${p.title}
Total: ${formatMoney(p.totalCents, p.currency)}

${exp}

View and respond here:
${p.publicUrl}

If you have questions, reply to this email or call our office.

Thank you,
PlumberOS (on behalf of your plumbing contractor)`;
  return { subject, bodyText };
}

function resolveProvider(): DeliveryProviderName {
  const v = (process.env.ESTIMATE_DELIVERY_PROVIDER || 'mock').toLowerCase();
  if (v === 'console') return 'console';
  if (v === 'email' || v === 'email_stub') return 'email_stub';
  return 'mock';
}

/**
 * Pluggable delivery: mock (log + DB), console (stdout), email_stub (no SMTP — records intent).
 */
export async function runEstimateDelivery(
  payload: EstimateDeliveryPayload,
): Promise<{ deliveryId: string; outcome: DeliveryOutcome }> {
  const { subject, bodyText } = buildEstimateEmailContent(payload);
  const provider = resolveProvider();
  const publicLink = payload.publicUrl;

  let outcome: DeliveryOutcome = {
    ok: true,
    provider,
    subject,
    bodyText,
  };

  if (provider === 'console') {
    console.info('[estimate-delivery:console]', { to: payload.recipient, subject, publicLink });
  }

  if (provider === 'email_stub') {
    outcome = {
      ...outcome,
      ok: true,
      providerMessageId: `stub-${Date.now()}`,
      errorMessage: null,
    };
    // Real SMTP would go here when ESTIMATE_SMTP_* is wired.
  }

  if (provider === 'mock') {
    outcome.providerMessageId = `mock-${Date.now()}`;
  }

  const status = outcome.ok ? 'sent' : 'failed';
  const ins = await sql`
    INSERT INTO estimate_delivery (
      estimate_id, delivery_type, recipient, subject, body_snapshot, provider,
      provider_message_id, status, public_link, sent_at, error_message
    )
    VALUES (
      ${payload.estimateId},
      'email',
      ${payload.recipient},
      ${subject},
      ${bodyText},
      ${provider},
      ${outcome.providerMessageId || null},
      ${status},
      ${publicLink},
      ${outcome.ok ? new Date().toISOString() : null},
      ${outcome.errorMessage || null}
    )
    RETURNING id
  `;
  const deliveryId = (ins[0] as { id: string }).id;

  return { deliveryId, outcome };
}
