export type DeliverySendInput = {
  estimateId: string;
  estimateNumber: string;
  customerName: string;
  title: string;
  totalCents: number;
  expirationDate: string | null;
  publicUrl: string;
  recipientEmail: string | null;
};

export type DeliveryResult = {
  provider: string;
  provider_message_id: string | null;
  status: 'sent' | 'failed';
  error_message?: string;
  subject: string;
  body: string;
};

export interface EstimateDeliveryProvider {
  readonly name: string;
  send(input: DeliverySendInput): Promise<DeliveryResult>;
}

function formatMoney(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function buildEstimateEmailCopy(input: DeliverySendInput): { subject: string; body: string } {
  const subject = `Estimate ${input.estimateNumber} — ${input.title}`;
  const exp = input.expirationDate
    ? `This estimate is valid through ${input.expirationDate}.`
    : 'Please review the scope and pricing at your earliest convenience.';
  const body = `Hi ${input.customerName},

We've prepared an estimate for the work we discussed.

Estimate: ${input.estimateNumber}
Total: ${formatMoney(input.totalCents)}

${exp}

View and respond here:
${input.publicUrl}

If you have questions, reply to this email or call our office.

Thank you,
Your plumbing team`;
  return { subject, body };
}

/** Logs to console; always "succeeds". For local/dev. */
export class ConsoleEstimateDeliveryProvider implements EstimateDeliveryProvider {
  readonly name = 'console';

  async send(input: DeliverySendInput): Promise<DeliveryResult> {
    const { subject, body } = buildEstimateEmailCopy(input);
    console.log('[estimate-delivery:console]\n', subject, '\n', body);
    return {
      provider: this.name,
      provider_message_id: `console-${Date.now()}`,
      status: 'sent',
      subject,
      body,
    };
  }
}

/** Mock / dev: no external I/O; records-ready payload. */
export class MockEstimateDeliveryProvider implements EstimateDeliveryProvider {
  readonly name = 'mock';

  async send(input: DeliverySendInput): Promise<DeliveryResult> {
    const { subject, body } = buildEstimateEmailCopy(input);
    return {
      provider: this.name,
      provider_message_id: `mock-${Date.now()}`,
      status: 'sent',
      subject,
      body,
    };
  }
}

/** Stub for future SMTP / SendGrid / Resend integration. */
export class EmailEstimateDeliveryProviderStub implements EstimateDeliveryProvider {
  readonly name = 'email_stub';

  async send(input: DeliverySendInput): Promise<DeliveryResult> {
    const { subject, body } = buildEstimateEmailCopy(input);
    if (!input.recipientEmail) {
      return {
        provider: this.name,
        provider_message_id: null,
        status: 'failed',
        error_message: 'No recipient email configured',
        subject,
        body,
      };
    }
    return {
      provider: this.name,
      provider_message_id: null,
      status: 'failed',
      error_message:
        'Email delivery is not wired yet. Set ESTIMATE_DELIVERY_PROVIDER=mock or console, or implement EmailEstimateDeliveryProviderStub with your provider.',
      subject,
      body,
    };
  }
}

export function getDeliveryProviderFromEnv(): EstimateDeliveryProvider {
  const v = (process.env.ESTIMATE_DELIVERY_PROVIDER || 'mock').toLowerCase();
  if (v === 'console') return new ConsoleEstimateDeliveryProvider();
  if (v === 'email' || v === 'email_stub') return new EmailEstimateDeliveryProviderStub();
  return new MockEstimateDeliveryProvider();
}
