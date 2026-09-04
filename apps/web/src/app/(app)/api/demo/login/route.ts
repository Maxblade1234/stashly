import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/demo/login
 *
 * Provisions a throwaway, pre-seeded demo account so a visitor (a recruiter,
 * say) can try the full product without signing up or confirming an email.
 * Each call creates its own isolated user — visitors never see each other's
 * data, and nobody can lock others out by changing a shared password.
 *
 * Returns credentials the client signs in with immediately. Accounts are
 * auto-confirmed and pruned after 24 hours.
 */

const DEMO_EMAIL_DOMAIN = 'demo.stashly.app';
const MAX_DEMO_ACCOUNTS_PER_HOUR = 5;
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;
/** Hard ceiling on live demo users. The per-IP limit is best-effort (in-memory,
 *  per instance, and IPs are cheap); this global cap is the real bound. */
const MAX_ACTIVE_DEMO_USERS = 300;
const LIST_PAGE_SIZE = 200;
const MAX_LIST_PAGES = 10;
const isDemoMode = process.env.NEXT_PUBLIC_STASHLY_MODE === 'demo';

export async function POST(req: NextRequest) {
  // Demo accounts seed fabricated transactions — never allow that on a live
  // (real-money) deployment, regardless of who asks.
  if (!isDemoMode) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`demo-login:${ip}`, MAX_DEMO_ACCOUNTS_PER_HOUR, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many demo accounts requested. Try again later.' }, { status: 429 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Demo accounts are not configured on this deployment.' }, { status: 503 });
  }

  // Housekeeping + global cap: prune stale demo users, then refuse if the
  // pool is still full. Bounds growth even if the per-IP limit is evaded.
  const activeDemoUsers = await pruneStaleDemoUsers(admin).catch(() => Number.POSITIVE_INFINITY);
  if (activeDemoUsers >= MAX_ACTIVE_DEMO_USERS) {
    return NextResponse.json(
      { error: 'The demo is at capacity right now. Please try again in a little while.' },
      { status: 429 }
    );
  }

  const email = `demo-${randomBytes(4).toString('hex')}@${DEMO_EMAIL_DOMAIN}`;
  const password = randomBytes(18).toString('base64url');

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { demo: true },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || 'Could not create demo account' }, { status: 500 });
  }

  const userId = created.user.id;

  // The on_auth_user_created trigger inserts the profile row; give it a beat
  // and then seed a believable history so the dashboard isn't empty.
  await seedDemoData(admin, userId).catch((err: Error) => {
    console.warn('[demo-login] seed failed (account still usable):', err.message);
  });

  return NextResponse.json({ email, password });
}

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

async function seedDemoData(admin: Admin, userId: string) {
  const { data: retailers } = await admin
    .from('retailers')
    .select('id, name')
    .in('name', ['Apple', 'Chipotle', 'Dominos', 'eBay']);

  const byName = (name: string) => retailers?.find((r) => r.name === name)?.id;

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  const transactions = [
    {
      user_id: userId,
      retailer_id: byName('Apple'),
      cards_purchased: [{ denomination: 100, cost: 93, code_last4: 'K4Q9' }],
      total_paid: 93,
      total_value: 100,
      savings: 7,
      residual_balance: 4.5,
      status: 'completed',
      demo: true,
      created_at: daysAgo(2),
    },
    {
      user_id: userId,
      retailer_id: byName('Chipotle'),
      cards_purchased: [
        { denomination: 25, cost: 22.5, code_last4: 'C3D4' },
        { denomination: 10, cost: 9.2, code_last4: 'E5F6' },
      ],
      total_paid: 31.7,
      total_value: 35,
      savings: 3.3,
      residual_balance: 2.25,
      status: 'completed',
      demo: true,
      created_at: daysAgo(6),
    },
    {
      user_id: userId,
      retailer_id: byName('Dominos'),
      cards_purchased: [{ denomination: 25, cost: 21.25, code_last4: 'P8Z2' }],
      total_paid: 21.25,
      total_value: 25,
      savings: 3.75,
      residual_balance: 0,
      status: 'completed',
      demo: true,
      created_at: daysAgo(11),
    },
    {
      user_id: userId,
      retailer_id: byName('eBay'),
      cards_purchased: [{ denomination: 100, cost: 96, code_last4: 'G7H8' }],
      total_paid: 96,
      total_value: 100,
      savings: 4,
      residual_balance: 0,
      status: 'completed',
      demo: true,
      created_at: daysAgo(19),
    },
  ].filter((t) => t.retailer_id);

  if (transactions.length > 0) {
    const { error } = await admin.from('transactions').insert(transactions);
    if (error) throw new Error(error.message);
  }

  const balances = [
    { user_id: userId, retailer_id: byName('Apple'), balance: 4.5 },
    { user_id: userId, retailer_id: byName('Chipotle'), balance: 2.25 },
  ].filter((b) => b.retailer_id);

  if (balances.length > 0) {
    const { error } = await admin
      .from('stashly_balances')
      .upsert(balances, { onConflict: 'user_id,retailer_id' });
    if (error) throw new Error(error.message);
  }

  const totalSavings = transactions.reduce((sum, t) => sum + t.savings, 0);
  await admin.from('profiles').update({ savings_total: totalSavings }).eq('id', userId);
}

/**
 * Deletes demo users older than PRUNE_AFTER_MS and returns how many demo
 * users remain. Walks every page of the user list (newest first) so old
 * accounts can't hide past the first page; bounded by MAX_LIST_PAGES.
 */
async function pruneStaleDemoUsers(admin: Admin): Promise<number> {
  const cutoff = Date.now() - PRUNE_AFTER_MS;
  const stale: string[] = [];
  let active = 0;

  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: LIST_PAGE_SIZE });
    if (error) throw new Error(error.message);
    const users = data?.users || [];
    for (const u of users) {
      if (!u.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`)) continue;
      if (new Date(u.created_at).getTime() < cutoff) stale.push(u.id);
      else active++;
    }
    if (users.length < LIST_PAGE_SIZE) break;
  }

  await Promise.allSettled(stale.map((id) => admin.auth.admin.deleteUser(id)));
  return active;
}
