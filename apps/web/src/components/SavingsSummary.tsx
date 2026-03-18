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
      iconColor: 'var(--green, #2D7A2F)',
      iconBg: 'var(--green-bg, #E8F5E9)',
    },
    {
      label: 'Saved This Month',
      value: `$${savedThisMonth.toFixed(2)}`,
      icon: DollarSign,
      iconColor: 'var(--green, #2D7A2F)',
      iconBg: 'var(--green-bg, #E8F5E9)',
    },
    {
      label: 'Transactions',
      value: transactionCount.toString(),
      icon: ShoppingBag,
      iconColor: 'var(--text-primary, #1A1A1A)',
      iconBg: 'rgba(26, 26, 26, 0.06)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: 'var(--surface, #FFFFFF)',
            border: '1px solid var(--border, #E8E3DB)',
            borderRadius: 'var(--radius-lg, 20px)',
            padding: '24px',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-2"
              style={{
                backgroundColor: card.iconBg,
                borderRadius: 'var(--radius-sm, 12px)',
              }}
            >
              <card.icon size={20} style={{ color: card.iconColor }} />
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-body, #6B6B6B)' }}
            >
              {card.label}
            </span>
          </div>
          <p
            className="text-2xl font-bold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary, #1A1A1A)',
            }}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
