import { Clock, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface TransactionRow {
  id: string;
  retailer_name: string;
  total_paid: number;
  savings: number;
  status: string;
  created_at: string;
}

interface RecentTransactionsProps {
  transactions: TransactionRow[];
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Recent Transactions
        </h2>
        <Link href="/history" className="text-sm font-medium flex items-center gap-1 hover:opacity-80" style={{ color: '#2B3FE0' }}>
          View all <ArrowUpRight size={14} />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <Clock size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No transactions yet</p>
          <p className="text-xs text-gray-400 mt-1">Your purchase history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{tx.retailer_name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(tx.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-mono)' }}>
                    ${tx.total_paid.toFixed(2)}
                  </p>
                  {tx.savings > 0 && (
                    <p className="text-xs text-green-600 font-medium">-${tx.savings.toFixed(2)} saved</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
