import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailability, reserveCards } from '@/lib/inventory-client';
import { calculateOptimalStack } from '@/lib/stacking';
import { rateLimit } from '@/lib/rate-limit';
import { randomUUID } from 'node:crypto';

const MAX_PURCHASES_PER_HOUR = 3;
const isDemoMode = process.env.STASHLY_MODE === 'demo';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(`purchase:${user.id}`, MAX_PURCHASES_PER_HOUR, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { retailer_id, cart_total } = await req.json();
  if (!retailer_id || !cart_total || cart_total <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { data: retailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('id', retailer_id)
    .eq('is_active', true)
    .single();

  if (!retailer) {
    return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
  }

  // Recalculate stack server-side
  const today = new Date().toISOString().split('T')[0];
  const { data: todayTxns } = await supabase
    .from('transactions')
    .select('total_paid')
    .eq('user_id', user.id)
    .eq('retailer_id', retailer_id)
    .eq('status', 'completed')
    .gte('created_at', `${today}T00:00:00Z`);

  const spentToday = (todayTxns || []).reduce((sum: number, t: any) => sum + t.total_paid, 0);
  const availability = await getAvailability(retailer.name);
  const stack = calculateOptimalStack(cart_total, availability, {
    maxCards: retailer.max_gift_cards_per_order,
    dailyLimitUsd: retailer.per_user_daily_limit_usd,
    spentTodayUsd: spentToday,
  });

  if (stack.cards.length === 0) {
    return NextResponse.json({ error: 'No gift cards available' }, { status: 409 });
  }

  const transactionId = randomUUID();

  const cardsToReserve = stack.cards.map(c => ({
    denomination: c.denomination,
    quantity: c.quantity,
  }));

  const reservation = await reserveCards(retailer.name, cardsToReserve, transactionId);
  if (!reservation.success) {
    return NextResponse.json({ error: 'Cards no longer available' }, { status: 409 });
  }

  await supabase.from('transactions').insert({
    id: transactionId,
    user_id: user.id,
    retailer_id,
    cards_purchased: [],
    total_paid: stack.total_paid,
    total_value: stack.total_gift_card_value,
    savings: stack.savings,
    residual_balance: stack.residual_balance,
    status: 'pending',
    demo: isDemoMode,
  });

  if (isDemoMode) {
    const demoCodes = stack.cards.flatMap(card =>
      Array.from({ length: card.quantity }, () => {
        const seg = () => randomUUID().slice(0, 4).toUpperCase();
        return {
          denomination: card.denomination,
          code: `DEMO-${seg()}-${seg()}-${seg()}`,
          pin: null,
          code_last4: seg(),
        };
      })
    );

    await supabase.from('transactions').update({
      status: 'completed',
      cards_purchased: demoCodes.map(c => ({
        denomination: c.denomination,
        cost: stack.cards.find(sc => sc.denomination === c.denomination)!.price_per_card,
        code_last4: c.code_last4,
      })),
    }).eq('id', transactionId);

    // Update Stashly balance
    if (stack.residual_balance > 0) {
      const { data: existing } = await supabase
        .from('stashly_balances')
        .select('id, balance')
        .eq('user_id', user.id)
        .eq('retailer_id', retailer_id)
        .single();

      if (existing) {
        await supabase.from('stashly_balances')
          .update({ balance: existing.balance + stack.residual_balance, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('stashly_balances').insert({
          user_id: user.id,
          retailer_id: retailer_id,
          balance: stack.residual_balance,
        });
      }
    }

    return NextResponse.json({
      transaction_id: transactionId,
      codes: demoCodes,
      residual_balance: stack.residual_balance,
      total_paid: stack.total_paid,
      total_savings: stack.savings,
    });
  }

  // Live mode: return transaction ID for payment page
  return NextResponse.json({
    transaction_id: transactionId,
    total_paid: stack.total_paid,
    total_savings: stack.savings,
    payment_required: true,
  });
}
