'use client';

import { useEffect, useState } from 'react';
import RetailerCard from '@/components/RetailerCard';
import { Search, Loader2 } from 'lucide-react';

interface Retailer {
  id: string;
  name: string;
  domain: string;
  available_denominations: number[];
  logo_url: string | null;
}

export default function GiftCardsPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/retailers')
      .then(res => res.json())
      .then(data => {
        setRetailers(data.retailers || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load retailers');
        setLoading(false);
      });
  }, []);

  const filtered = retailers.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Gift Cards
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse discounted gift cards from top retailers
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search retailers..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {error ? (
        <div className="text-center py-20">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">
            {search ? 'No retailers match your search' : 'No gift cards available right now'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <RetailerCard
              key={r.id}
              id={r.id}
              name={r.name}
              domain={r.domain}
              denominations={r.available_denominations}
              logoUrl={r.logo_url}
            />
          ))}
        </div>
      )}
    </div>
  );
}
