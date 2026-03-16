import { TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';

interface SavingsSummaryProps {
  totalSaved: number;
  savedThisMonth: number;
  transactionCount: number;
}

export default function SavingsSummary({ totalSaved, savedThisMonth, transactionCount }: SavingsSummaryProps) {
  const cards = [
    {
      label: 'Total Saved',
      value: `$${totalSaved.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Saved This Month',
      value: `$${savedThisMonth.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Transactions',
      value: transactionCount.toString(),
      icon: ShoppingBag,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
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
  );
}
