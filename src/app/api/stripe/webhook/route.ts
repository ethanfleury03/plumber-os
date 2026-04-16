import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { sql } from '@/lib/db';
import { getStripe } from '@/lib/payments/stripe';
import {
  fulfillCheckoutSession,
  markPaymentExpiredBySessionId,
  recordStripeEventProcessed,
} from '@/lib/payments/payment-service';

export async function POST(request: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !whSecret) {
    return NextResponse.json({ error: 'Stripe webhooks not configured' }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const dupRows = await sql`SELECT 1 FROM payment_events WHERE stripe_event_id = ${event.id} LIMIT 1`;
  if (dupRows.length) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckoutSession(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await markPaymentExpiredBySessionId(session.id);
        break;
      }
      default:
        break;
    }
    await recordStripeEventProcessed(event.id, event.type, null, { ok: true });
  } catch (e) {
    console.error('[stripe webhook]', e);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
