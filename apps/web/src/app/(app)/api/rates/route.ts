import { NextRequest, NextResponse } from 'next/server';
import { compareRates } from '@/services/marketplace';
import { rateLimit } from '@/lib/rate-limit';

const MAX_CHECKS_PER_HOUR = 60;

// Rate comparison is public data (no account required to see market prices),
// so unlike /stack this endpoint needs no auth — just an IP rate limit.
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`rates:${ip}`, MAX_CHECKS_PER_HOUR, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const retailer = req.nextUrl.searchParams.get('retailer');
  if (!retailer || retailer.length > 100) {
    return NextResponse.json({ error: 'Missing or invalid retailer' }, { status: 400 });
  }

  const cartTotalParam = req.nextUrl.searchParams.get('cart_total');
  let cartTotal: number | undefined;
  if (cartTotalParam !== null) {
    cartTotal = Number(cartTotalParam);
    if (!Number.isFinite(cartTotal) || cartTotal <= 0 || cartTotal > 100000) {
      return NextResponse.json({ error: 'Invalid cart_total' }, { status: 400 });
    }
  }

  const comparison = await compareRates(retailer, cartTotal);
  return NextResponse.json({ comparison });
}
