import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('retailers')
    .select('id, name, domain, checkout_url_patterns, cart_total_selectors, gift_card_input_selector, gift_card_pin_selector, apply_button_selector, add_another_selector, max_gift_cards_per_order, available_denominations, per_user_daily_limit_usd, stacking_notes, logo_url')
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
