import { createClient } from '@/lib/supabase/server';
import SavingsSummary from '@/components/SavingsSummary';
import BalanceList from '@/components/BalanceList';
import RecentTransactions from '@/components/RecentTransactions';
import Link from 'next/link';
import { Gift } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch profile for savings total
  const { data: profile } = await supabase
    .from('profiles')
    .select('savings_total, created_at')
    .eq('id', user!.id)
    .single();

  // Fetch recent transactions with retailer names
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, total_paid, savings, status, created_at, retailer_id, retailers(name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate this-month savings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthTransactions } = await supabase
    .from('transactions')
    .select('savings')
    .eq('user_id', user!.id)
    .eq('status', 'completed')
    .gte('created_at', startOfMonth.toISOString());

  const savedThisMonth = (monthTransactions || []).reduce((sum, t) => sum + (t.savings || 0), 0);
  const totalTransactions = transactions?.length || 0;

  // Format transactions for display
  const formattedTransactions = (transactions || []).map(tx => ({
    id: tx.id,
    retailer_name: (tx.retailers as unknown as { name: string })?.name || 'Unknown',
    total_paid: tx.total_paid,
    savings: tx.savings,
    status: tx.status,
    created_at: tx.created_at,
  }));

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-light, #FAF7F2)' }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary, #1A1A1A)',
              }}
            >
              Dashboard
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-body, #6B6B6B)' }}
            >
              Welcome back, {user?.email?.split('@')[0]}! Here&apos;s your savings overview.
            </p>
          </div>
          <Link
            href="/gift-cards"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--dark, #1A1A1A)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-pill, 999px)',
            }}
          >
            <Gift size={16} />
            Browse Gift Cards
          </Link>
        </div>

        <SavingsSummary
          totalSaved={profile?.savings_total || 0}
          savedThisMonth={savedThisMonth}
          transactionCount={totalTransactions}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <RecentTransactions transactions={formattedTransactions} />
          <BalanceList />
        </div>
      </div>
    </div>
  );
}
