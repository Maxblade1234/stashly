'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, CreditCard } from 'lucide-react';

interface PaymentInputProps {
  onTokenized: (token: string, last4: string, brand: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  buttonText?: string;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#111827',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};

export default function PaymentInput({
  onTokenized,
  onError,
  disabled = false,
  buttonText = 'Save Card',
}: PaymentInputProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not ready. Please wait.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card input not found.');
      return;
    }

    setProcessing(true);
    setCardError('');

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setCardError(error.message || 'Card validation failed');
        onError(error.message || 'Card validation failed');
        return;
      }

      if (paymentMethod) {
        onTokenized(
          paymentMethod.id,
          paymentMethod.card?.last4 || '0000',
          paymentMethod.card?.brand || 'unknown'
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setCardError(msg);
      onError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={(e) => {
            setCardComplete(e.complete);
            if (e.error) {
              setCardError(e.error.message);
            } else {
              setCardError('');
            }
          }}
        />
      </div>

      {cardError && (
        <p className="text-xs text-red-600">{cardError}</p>
      )}

      <button
        type="submit"
        disabled={disabled || processing || !cardComplete || !stripe}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all hover:shadow-lg disabled:opacity-50"
        style={{ backgroundColor: '#2B3FE0' }}
      >
        {processing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <CreditCard size={16} />
            {buttonText}
          </>
        )}
      </button>
    </form>
  );
}
