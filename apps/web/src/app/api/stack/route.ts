import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailability } from '@/lib/inventory-client';
import { calculateOptimalStack } from '@/lib/stacking';
import { rateLimit } from '@/lib/rate-limit';

const MAX_CHECKS_PER_HOUR = 10;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(`stack:${user.id}`, MAX_CHECKS_PER_HOUR, 60 * 60 * 1000)) {
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

  const today = new Date().toISOString().split('T')[0];
  const { data: todayTransactions } = await supabase
    .from('transactions')
    .select('total_paid')
    .eq('user_id', user.id)
    .eq('retailer_id', retailer_id)
    .eq('status', 'completed')
    .gte('created_at', `${today}T00:00:00Z`);

  const spentToday = (todayTransactions || []).reduce((sum: number, t: any) => sum + t.total_paid, 0);

  const availability = await getAvailability(retailer.name);

  const stack = calculateOptimalStack(cart_total, availability, {
    maxCards: retailer.max_gift_cards_per_order,
    dailyLimitUsd: retailer.per_user_daily_limit_usd,
    spentTodayUsd: spentToday,
  });

  return NextResponse.json(stack);
}
