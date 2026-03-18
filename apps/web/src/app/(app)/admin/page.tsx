import { createClient } from '@/lib/supabase/server';
import { DollarSign, Package, Users } from 'lucide-react';

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Fetch summary stats
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: transactions } = await supabase
    .from('transactions')
    .select('total_paid, savings, status');

  const completedTx = (transactions || []).filter(t => t.status === 'completed');
  const totalRevenue = completedTx.reduce((sum, t) => sum + (t.total_paid || 0), 0);
  const totalSavingsDelivered = completedTx.reduce((sum, t) => sum + (t.savings || 0), 0);

  const cards = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Cards Sold',
      value: completedTx.length.toString(),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Users',
      value: (userCount || 0).toString(),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`${card.bg} p-2 rounded-xl`}>
                <card.icon size={20} className={card.color} />
              </div>
              <span className="text-sm text-gray-500 font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Quick Stats
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Total savings delivered to users</span>
            <span className="font-bold text-green-600" style={{ fontFamily: 'var(--font-mono)' }}>
              ${totalSavingsDelivered.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Total transactions</span>
            <span className="font-medium text-gray-900">{(transactions || []).length}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Completion rate</span>
            <span className="font-medium text-gray-900">
              {transactions && transactions.length > 0
                ? `${((completedTx.length / transactions.length) * 100).toFixed(0)}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
