'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StackBreakdown from '@/components/StackBreakdown';
import MarketplaceComparison from '@/components/MarketplaceComparison';
import PurchaseConfirmation from '@/components/PurchaseConfirmation';
import SavedCardPill from '@/components/SavedCardPill';
import StripeProvider from '@/components/StripeProvider';
import PaymentInput from '@/components/PaymentInput';
import type { StackRecommendation, PurchaseResponse } from '@stashly/shared';
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function BuyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    }>
      <BuyPageContent />
    </Suspense>
  );
}

function BuyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const retailerId = searchParams.get('retailer');
  const amountParam = searchParams.get('amount');

  const [cartTotal, setCartTotal] = useState(amountParam || '');
  const [stack, setStack] = useState<StackRecommendation | null>(null);
  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);
  const [retailerName, setRetailerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  const isDemoMode = process.env.NEXT_PUBLIC_STASHLY_MODE === 'demo';
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [showNewCard, setShowNewCard] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);

  // Auto-fetch stack if amount is provided
  useEffect(() => {
    if (amountParam && retailerId) {
      fetchStack(parseFloat(amountParam));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStack = async (amount: number) => {
    if (!retailerId || amount <= 0) return;
    setLoading(true);
    setError('');
    setStack(null);

    try {
      const res = await fetch('/api/stack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retailer_id: retailerId, cart_total: amount }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to calculate savings');
      }

      const data = await res.json();
      setStack(data.stack);
      setRetailerName(data.stack.retailer_name);

      // Fetch payment methods in live mode
      if (process.env.NEXT_PUBLIC_STASHLY_MODE !== 'demo') {
        setLoadingMethods(true);
        try {
          const pmRes = await fetch('/api/payment-methods');
          const pmData = await pmRes.json();
          const methods = pmData.methods || [];
          setPaymentMethods(methods);
          const defaultMethod = methods.find((m: any) => m.isDefault);
          if (defaultMethod) setSelectedMethodId(defaultMethod.id);
        } catch {
          // Non-fatal — user can still add a new card
        } finally {
          setLoadingMethods(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!retailerId || !stack) return;
    setPurchasing(true);
    setError('');

    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailer_id: retailerId,
          cart_total: stack.cart_total,
          ...(selectedMethodId && { payment_method_id: selectedMethodId }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Purchase failed');
      }

      const data: PurchaseResponse = await res.json();
      setPurchase(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (!retailerId) {
    router.push('/gift-cards');
    return null;
  }

  // Purchase complete view
  if (purchase) {
    return (
      <div className="max-w-lg mx-auto px-6 py-10">
        <PurchaseConfirmation
          codes={purchase.codes}
          totalSavings={purchase.total_savings}
          residualBalance={purchase.residual_balance}
          retailerName={retailerName}
        />
        <div className="text-center mt-6 space-x-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:opacity-80"
            style={{ color: '#2B3FE0' }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/gift-cards"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Buy More
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <Link
        href="/gift-cards"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={14} />
        Back to Gift Cards
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {retailerName || 'Calculate Savings'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your cart total to see how much you can save
      </p>

      {/* Cart total input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cart Total</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            value={cartTotal}
            onChange={e => setCartTotal(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button
          onClick={() => fetchStack(parseFloat(cartTotal))}
          disabled={loading || !cartTotal || parseFloat(cartTotal) <= 0}
          className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all hover:shadow-lg disabled:opacity-50"
          style={{ backgroundColor: '#2B3FE0' }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <ShoppingCart size={16} />
              Calculate Savings
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl mb-4">{error}</p>
      )}

      {/* Stack breakdown */}
      {stack && stack.cards.length > 0 && (
        <>
          <StackBreakdown stack={stack} />

          <div className="mt-4">
            <MarketplaceComparison
              retailerName={stack.retailer_name}
              cartTotal={stack.cart_total}
            />
          </div>

          {/* Payment method selection — live mode only */}
          {!isDemoMode && (
            <div className="mt-4 mb-2">
              {loadingMethods ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              ) : paymentMethods.length > 0 && !showNewCard ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">Pay with</p>
                  {paymentMethods.map((m: any) => (
                    <SavedCardPill
                      key={m.id}
                      last4={m.last4}
                      brand={m.brand}
                      isDefault={m.isDefault}
                      selected={selectedMethodId === m.id}
                      onSelect={() => setSelectedMethodId(m.id)}
                    />
                  ))}
                  <button
                    onClick={() => setShowNewCard(true)}
                    className="text-xs font-medium hover:opacity-80"
                    style={{ color: '#2B3FE0' }}
                  >
                    + Use a different card
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {paymentMethods.length > 0 ? 'Add a new card' : 'Add a payment method'}
                  </p>
                  <StripeProvider>
                    <PaymentInput
                      onTokenized={async (token: string) => {
                        try {
                          const res = await fetch('/api/payment-methods', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setPaymentMethods(prev => [...prev, data]);
                            setSelectedMethodId(data.id);
                            setShowNewCard(false);
                          }
                        } catch {
                          // Error handled by PaymentInput
                        }
                      }}
                      onError={(msg: string) => setError(msg)}
                      buttonText="Save Card"
                    />
                  </StripeProvider>
                  {paymentMethods.length > 0 && (
                    <button
                      onClick={() => setShowNewCard(false)}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Use saved card instead
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handlePurchase}
            disabled={purchasing || (!isDemoMode && !selectedMethodId)}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: '#00C853' }}
          >
            {purchasing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              `Complete Purchase — Save $${stack.savings.toFixed(2)}`
            )}
          </button>
        </>
      )}

      {stack && stack.cards.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No gift cards available for this amount right now.</p>
        </div>
      )}
    </div>
  );
}
