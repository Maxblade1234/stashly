'use client';

import { useEffect, useState } from 'react';
import { Loader2, Store, ToggleLeft, ToggleRight } from 'lucide-react';

interface Retailer {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  available_denominations: number[];
  per_user_daily_limit_usd: number;
  max_gift_cards_per_order: number | null;
}

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRetailers = () => {
    fetch('/api/admin/retailers')
      .then(res => res.json())
      .then(data => {
        setRetailers(data.retailers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRetailers(); }, []);

  const toggleActive = async (retailer: Retailer) => {
    await fetch('/api/admin/retailers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...retailer, is_active: !retailer.is_active }),
    });
    fetchRetailers();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-display)' }}>
        Retailer Configuration
      </h2>

      {retailers.length === 0 ? (
        <div className="text-center py-12">
          <Store size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No retailers configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {retailers.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{r.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.domain}</p>
                </div>
                <button onClick={() => toggleActive(r)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  {r.is_active ? <ToggleRight size={28} className="text-green-500" /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span>Denominations: {r.available_denominations.map(d => `$${d}`).join(', ')}</span>
                <span>Daily limit: ${r.per_user_daily_limit_usd}</span>
                {r.max_gift_cards_per_order && <span>Max cards/order: {r.max_gift_cards_per_order}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
