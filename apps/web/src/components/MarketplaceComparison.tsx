'use client';

import { useEffect, useState } from 'react';
import type { RateComparison } from '@stashly/shared';
import { ExternalLink, Zap } from 'lucide-react';

interface MarketplaceComparisonProps {
  retailerName: string;
  cartTotal?: number;
}

/**
 * Compares Stashly's price against partner marketplaces (CardCash, Raise,
 * GCX, GiftCardWiki). External quotes link out; Stashly quotes are
 * fulfilled in-app with instant delivery.
 */
export default function MarketplaceComparison({ retailerName, cartTotal }: MarketplaceComparisonProps) {
  const [comparison, setComparison] = useState<RateComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ retailer: retailerName });
    if (cartTotal && cartTotal > 0) params.set('cart_total', String(cartTotal));

    fetch(`/api/rates?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (!cancelled) setComparison(data.comparison);
      })
      .catch(() => {
        // Comparison is an enhancement — fail silently if unavailable
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retailerName, cartTotal]);

  if (loading || !comparison || comparison.quotes.length === 0) return null;

  const bestSource = comparison.best?.source;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Price Check Across Marketplaces
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Live comparison with verified gift card resellers
      </p>

      <div className="space-y-2">
        {comparison.quotes.map((q) => {
          const isBest = q.source === bestSource;
          const inner = (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {q.source_label}
                  {q.via && <span className="text-gray-400 font-normal"> · via {q.via}</span>}
                </span>
                {isBest && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Best
                  </span>
                )}
                {q.fulfillment === 'instant' && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    <Zap size={9} /> Instant
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm font-semibold text-green-600">
                  {q.discount_percent.toFixed(1)}% off
                </span>
                {q.purchase_url && <ExternalLink size={13} className="text-gray-400" />}
              </div>
            </>
          );

          const rowClass = `flex items-center justify-between px-4 py-3 rounded-xl ${
            isBest ? 'bg-green-50' : 'bg-gray-50'
          }`;

          return q.purchase_url ? (
            <a
              key={q.source}
              href={q.purchase_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`${rowClass} transition-colors hover:bg-gray-100`}
            >
              {inner}
            </a>
          ) : (
            <div key={q.source} className={rowClass}>
              {inner}
            </div>
          );
        })}
      </div>

      {comparison.cart_total != null && comparison.estimated_savings != null && (
        <p className="text-sm text-gray-600 mt-4 text-center">
          Estimated savings on your ${comparison.cart_total.toFixed(2)} cart:{' '}
          <span className="font-semibold text-green-600">
            ${comparison.estimated_savings.toFixed(2)}
          </span>
        </p>
      )}

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        External rates are indicative; we may earn a commission on partner purchases.
      </p>
    </div>
  );
}
