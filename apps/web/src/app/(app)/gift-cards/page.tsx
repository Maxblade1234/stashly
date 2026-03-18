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
        setRetailers(Array.isArray(data) ? data : data.retailers || []);
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-light, #FAF7F2)' }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary, #1A1A1A)',
            }}
          >
            Gift Cards
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--text-body, #6B6B6B)' }}
          >
            Browse discounted gift cards from top retailers
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-light, #9A9A9A)' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search retailers..."
            className="w-full pl-11 pr-4 text-sm transition-all focus:outline-none"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border, #E8E3DB)',
              borderRadius: 'var(--radius-sm, 12px)',
              padding: '14px 16px',
              paddingLeft: '44px',
              color: 'var(--text-primary, #1A1A1A)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--dark, #1A1A1A)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 26, 26, 0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border, #E8E3DB)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {error ? (
          <div className="text-center py-20">
            <p className="text-sm mb-2" style={{ color: '#D32F2F' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs hover:underline"
              style={{ color: 'var(--text-body, #6B6B6B)' }}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: 'var(--text-light, #9A9A9A)' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: 'var(--text-light, #9A9A9A)' }}>
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
    </div>
  );
}
