'use client';

import { useState } from 'react';
import { Check, Copy, PartyPopper } from 'lucide-react';
import type { DeliveredCode } from '@stashly/shared';

interface PurchaseConfirmationProps {
  codes: DeliveredCode[];
  totalSavings: number;
  residualBalance: number;
  retailerName: string;
}

export default function PurchaseConfirmation({
  codes,
  totalSavings,
  residualBalance,
  retailerName,
}: PurchaseConfirmationProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);

    // Notify extension via postMessage
    window.postMessage({ type: 'STASHLY_CODE_DELIVERED', code, retailer: retailerName }, '*');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4">
        <PartyPopper size={28} className="text-green-600" />
      </div>

      <h2 className="text-xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Purchase Complete!
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        You saved <span className="font-bold text-green-600">${totalSavings.toFixed(2)}</span> on {retailerName}
      </p>

      {/* Gift card codes */}
      <div className="space-y-3 text-left mb-6">
        {codes.map((c, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">${c.denomination} Gift Card</p>
              <p className="text-sm font-bold tracking-wider text-gray-900" style={{ fontFamily: 'var(--font-mono)' }}>
                {c.code}
              </p>
              {c.pin && (
                <p className="text-xs text-gray-500 mt-0.5">PIN: {c.pin}</p>
              )}
            </div>
            <button
              onClick={() => handleCopy(c.code, i)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Copy code"
            >
              {copiedIndex === i ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} className="text-gray-400" />
              )}
            </button>
          </div>
        ))}
      </div>

      {residualBalance > 0 && (
        <p className="text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-xl">
          <span className="font-medium text-blue-700">${residualBalance.toFixed(2)}</span> has been added to your Stashly balance for future {retailerName} purchases.
        </p>
      )}
    </div>
  );
}
