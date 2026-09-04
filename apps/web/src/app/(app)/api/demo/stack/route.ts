import { NextRequest, NextResponse } from 'next/server';
import { getAvailability } from '@/lib/inventory-client';
import { calculateOptimalStack } from '@/lib/stacking';
import { rateLimit } from '@/lib/rate-limit';

const isDemoMode = process.env.NEXT_PUBLIC_STASHLY_MODE === 'demo';
const MAX_CHECKS_PER_HOUR = 120;

/**
 * POST /api/demo/stack — unauthenticated stack computation for the interactive
 * checkout simulator. Only served in demo mode: in live mode inventory shape
 * is sensitive and stays behind the authenticated /api/stack endpoint.
 */
export async function POST(req: NextRequest) {
  if (!isDemoMode) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`demo-stack:${ip}`, MAX_CHECKS_PER_HOUR, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const retailerName = typeof body?.retailer_name === 'string' ? body.retailer_name.slice(0, 100) : '';
  const cartTotal = Number(body?.cart_total);

  if (!retailerName || !Number.isFinite(cartTotal) || cartTotal <= 0 || cartTotal > 10000) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const availability = await getAvailability(retailerName);
  const stack = calculateOptimalStack(cartTotal, availability, {
    maxCards: 5,
    dailyLimitUsd: 500,
    spentTodayUsd: 0,
  });

  return NextResponse.json({ stack });
}
