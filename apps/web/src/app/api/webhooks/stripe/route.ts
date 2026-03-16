import { NextRequest, NextResponse } from 'next/server';
import { createPaymentService, PaymentError } from '@/services/payment';
import { createClient as createAdminClient, SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, any, any>;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    const paymentService = createPaymentService();
    event = await paymentService.handleWebhook(rawBody, signature);
  } catch (err) {
    if (err instanceof PaymentError) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    throw err;
  }

  const supabase = getAdminClient();

  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await supabase.from('webhook_events').insert({
    id: event.id,
    type: event.type,
    processor: 'stripe',
    data: event.data,
  });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, event.data);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, event.data);
        break;
      case 'charge.refunded':
        await handleRefund(supabase, event.data);
        break;
      case 'charge.dispute.created':
        await handleDispute(supabase, event.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(
  supabase: AdminClient,
  data: Record<string, unknown>
) {
  const processorTxnId = data.id as string;
  const metadata = (data.metadata || {}) as Record<string, string>;
  const transactionId = metadata.transactionId;
  if (!transactionId) return;

  const { data: txn } = await supabase
    .from('transactions')
    .select('status')
    .eq('id', transactionId)
    .single();

  if (txn?.status === 'pending') {
    await supabase.from('transactions').update({
      status: 'completed',
      processor_transaction_id: processorTxnId,
    }).eq('id', transactionId);
  }
}

async function handlePaymentFailed(
  supabase: AdminClient,
  data: Record<string, unknown>
) {
  const metadata = (data.metadata || {}) as Record<string, string>;
  const transactionId = metadata.transactionId;
  if (!transactionId) return;

  await supabase.from('transactions').update({
    status: 'failed',
  }).eq('id', transactionId);

  try {
    const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
    await fetch(`${INVENTORY_URL}/cards/unreserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': process.env.INVENTORY_SERVICE_API_KEY || '',
      },
      body: JSON.stringify({ transaction_id: transactionId }),
    });
  } catch (err) {
    console.error('Failed to release reservation for', transactionId, err);
  }
}

async function handleRefund(
  supabase: AdminClient,
  data: Record<string, unknown>
) {
  const paymentIntentId = data.payment_intent as string;
  if (!paymentIntentId) return;

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, user_id, retailer_id, savings')
    .eq('processor_transaction_id', paymentIntentId)
    .single();

  if (!txn) return;

  await supabase.from('transactions').update({
    status: 'refunded',
  }).eq('id', txn.id);

  const { data: balance } = await supabase
    .from('stashly_balances')
    .select('id, balance')
    .eq('user_id', txn.user_id)
    .eq('retailer_id', txn.retailer_id)
    .single();

  if (balance && balance.balance > 0) {
    const newBalance = Math.max(0, balance.balance - (txn.savings || 0));
    await supabase.from('stashly_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', balance.id);
  }
}

async function handleDispute(
  supabase: AdminClient,
  data: Record<string, unknown>
) {
  const paymentIntentId = data.payment_intent as string;
  console.warn(`DISPUTE received for payment_intent: ${paymentIntentId}`, data);

  if (paymentIntentId) {
    const { data: txn } = await supabase
      .from('transactions')
      .select('id')
      .eq('processor_transaction_id', paymentIntentId)
      .single();

    if (txn) {
      console.warn(`Transaction ${txn.id} has a dispute. Review in Stripe dashboard.`);
    }
  }
}
