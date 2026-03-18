'use client';

import { useEffect, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  retailer_name: string;
  total_paid: number;
  total_value: number;
  savings: number;
  status: string;
  demo: boolean;
  created_at: string;
  cards_purchased: { denomination: number; cost: number; code_last4: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/transactions?page=${page}&limit=10`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
        setPagination(data.pagination);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Transaction History
      </h1>
      <p className="text-sm text-gray-500 mb-8">All your gift card purchases</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20">
          <Clock size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">No transactions yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{tx.retailer_name}</h3>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.demo && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Demo</span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* Cards breakdown */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {tx.cards_purchased.map((card, i) => (
                    <span key={i} className="text-xs bg-gray-50 px-2 py-1 rounded-lg text-gray-600">
                      ${card.denomination} (****{card.code_last4})
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-3">
                  <div className="flex gap-4">
                    <span className="text-gray-500">
                      Paid: <span className="font-bold text-gray-900" style={{ fontFamily: 'var(--font-mono)' }}>${tx.total_paid.toFixed(2)}</span>
                    </span>
                    <span className="text-gray-500">
                      Value: <span className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-mono)' }}>${tx.total_value.toFixed(2)}</span>
                    </span>
                  </div>
                  {tx.savings > 0 && (
                    <span className="text-green-600 font-bold text-sm">
                      Saved ${tx.savings.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
