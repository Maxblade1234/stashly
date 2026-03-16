'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, CreditCard } from 'lucide-react';
import SavedCardPill from './SavedCardPill';
import StripeProvider from './StripeProvider';
import PaymentInput from './PaymentInput';

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  isDefault: boolean;
}

export default function PaymentMethodManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-methods');
      if (!res.ok) throw new Error('Failed to load payment methods');
      const data = await res.json();
      setMethods(data.methods || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const handleTokenized = async (token: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save card');
      }
      setShowAddCard(false);
      await fetchMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      await fetchMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}/default`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to set default');
      await fetchMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Payment Methods
        </h2>
        {!showAddCard && (
          <button
            onClick={() => setShowAddCard(true)}
            className="text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: '#2B3FE0' }}
          >
            <Plus size={14} />
            Add Card
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
      )}

      {methods.length === 0 && !showAddCard && (
        <div className="text-center py-6">
          <CreditCard size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No payment methods saved</p>
          <button
            onClick={() => setShowAddCard(true)}
            className="mt-2 text-sm font-medium hover:opacity-80"
            style={{ color: '#2B3FE0' }}
          >
            Add your first card
          </button>
        </div>
      )}

      {methods.length > 0 && (
        <div className="space-y-2 mb-3">
          {methods.map(m => (
            <SavedCardPill
              key={m.id}
              last4={m.last4}
              brand={m.brand}
              isDefault={m.isDefault}
              onSelect={() => !m.isDefault && handleSetDefault(m.id)}
              onRemove={() => handleRemove(m.id)}
            />
          ))}
        </div>
      )}

      {showAddCard && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <StripeProvider>
            <PaymentInput
              onTokenized={handleTokenized}
              onError={(msg) => setError(msg)}
              disabled={saving}
              buttonText={saving ? 'Saving...' : 'Save Card'}
            />
          </StripeProvider>
          <button
            onClick={() => setShowAddCard(false)}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
