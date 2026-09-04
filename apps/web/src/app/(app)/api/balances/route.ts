import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('stashly_balances')
    .select('id, retailer_id, balance, retailers(name, logo_url)')
    .eq('user_id', user.id)
    .gt('balance', 0);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const balances = (data || []).map((b: any) => ({
    id: b.id,
    retailer_id: b.retailer_id,
    retailer_name: b.retailers?.name,
    balance: b.balance,
  }));

  // Consumers (dashboard BalanceList, extension service worker) read `balances`.
  return NextResponse.json({ balances });
}
