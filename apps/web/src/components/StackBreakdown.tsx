import type { StackRecommendation } from '@stashly/shared';

interface StackBreakdownProps {
  stack: StackRecommendation;
}

export default function StackBreakdown({ stack }: StackBreakdownProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Your Savings Breakdown
      </h3>

      {/* Cards table */}
      <div className="space-y-2 mb-5">
        {stack.cards.map((card, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50">
            <div>
              <span className="text-sm font-medium text-gray-800">
                {card.quantity}× ${card.denomination} card
              </span>
              <span className="text-xs text-green-600 ml-2">
                {card.discount_percent.toFixed(1)}% off
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-mono)' }}>
              ${card.total_price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Cart total</span>
          <span className="text-gray-700" style={{ fontFamily: 'var(--font-mono)' }}>
            ${stack.cart_total.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Gift card value</span>
          <span className="text-gray-700" style={{ fontFamily: 'var(--font-mono)' }}>
            ${stack.total_gift_card_value.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">You pay</span>
          <span className="font-bold text-gray-900" style={{ fontFamily: 'var(--font-mono)' }}>
            ${stack.total_paid.toFixed(2)}
          </span>
        </div>
        {stack.remaining_to_pay > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Remaining (pay at checkout)</span>
            <span className="text-gray-700" style={{ fontFamily: 'var(--font-mono)' }}>
              ${stack.remaining_to_pay.toFixed(2)}
            </span>
          </div>
        )}
        {stack.residual_balance > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Stashly balance (saved for later)</span>
            <span className="text-green-600 font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
              +${stack.residual_balance.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
          <span className="font-semibold text-green-700">Your savings</span>
          <span className="font-bold text-green-700" style={{ fontFamily: 'var(--font-mono)' }}>
            ${stack.savings.toFixed(2)} ({stack.savings_percent.toFixed(1)}%)
          </span>
        </div>
      </div>

      {stack.capped && stack.cap_reason && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl mt-4">
          {stack.cap_reason}
        </p>
      )}
    </div>
  );
}
