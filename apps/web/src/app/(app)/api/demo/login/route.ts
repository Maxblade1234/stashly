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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`demo-login:${ip}`, MAX_DEMO_ACCOUNTS_PER_HOUR, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many demo accounts requested. Try again later.' }, { status: 429 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Demo accounts are not configured on this deployment.' }, { status: 503 });
  }

  // Housekeeping: prune stale demo users so the auth table doesn't grow forever.
  await pruneStaleDemoUsers(admin).catch(() => {});

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

async function pruneStaleDemoUsers(admin: Admin) {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const cutoff = Date.now() - PRUNE_AFTER_MS;
  const stale = (data?.users || []).filter(
    (u) => u.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`) && new Date(u.created_at).getTime() < cutoff
  );
  await Promise.allSettled(stale.map((u) => admin.auth.admin.deleteUser(u.id)));
}
