'use client';

import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';

interface Balance {
  id: string;
  retailer_name: string;
  balance: number;
}

export default function BalanceList() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/balances')
      .then(res => res.json())
      .then(data => {
        setBalances(data.balances || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load balances');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Stashly Balances
        </h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Stashly Balances
        </h2>
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Stashly Balances
      </h2>
      {balances.length === 0 ? (
        <div className="text-center py-8">
          <Wallet size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No balances yet</p>
          <p className="text-xs text-gray-400 mt-1">Leftover gift card value from purchases will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {balances.map(b => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">{b.retailer_name}</span>
              <span className="text-sm font-bold text-green-600" style={{ fontFamily: 'var(--font-mono)' }}>
                ${b.balance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
