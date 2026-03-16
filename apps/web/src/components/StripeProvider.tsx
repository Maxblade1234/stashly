'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

let cachedKey: string | null = null;
let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise(publishableKey: string) {
  if (!stripePromise || cachedKey !== publishableKey) {
    cachedKey = publishableKey;
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/payment/config')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load payment config');
        return res.json();
      })
      .then(data => setPublishableKey(data.publishableKey))
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-500">Payment system unavailable. Please try again later.</p>
      </div>
    );
  }

  if (!publishableKey) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Elements stripe={getStripePromise(publishableKey)} options={{ locale: 'en' }}>
      {children}
    </Elements>
  );
}
