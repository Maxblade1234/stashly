import { describe, it, expect } from 'vitest';
import { calculateOptimalStack } from '../stacking';

const availability = [
  { retailer_name: 'Apple', denomination: 25, available: true, discount_percent: 10, price: 22.50 },
  { retailer_name: 'Apple', denomination: 50, available: true, discount_percent: 11, price: 44.50 },
  { retailer_name: 'Apple', denomination: 100, available: true, discount_percent: 10.5, price: 89.50 },
];

describe('calculateOptimalStack', () => {
  it('covers a simple cart total with one card', () => {
    const result = calculateOptimalStack(45, availability, { maxCards: 10, dailyLimitUsd: 500, spentTodayUsd: 0 });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].denomination).toBe(50);
    expect(result.total_gift_card_value).toBe(50);
    expect(result.residual_balance).toBe(5);
  });

  it('stacks multiple cards for large cart', () => {
    const result = calculateOptimalStack(280, availability, { maxCards: 10, dailyLimitUsd: 500, spentTodayUsd: 0 });
    expect(result.total_gift_card_value).toBeGreaterThanOrEqual(280);
    expect(result.savings).toBeGreaterThan(0);
  });

  it('respects max card limit', () => {
    const result = calculateOptimalStack(1000, availability, { maxCards: 3, dailyLimitUsd: 5000, spentTodayUsd: 0 });
    const totalCards = result.cards.reduce((sum, c) => sum + c.quantity, 0);
    expect(totalCards).toBeLessThanOrEqual(3);
    expect(result.capped).toBe(true);
  });

  it('respects daily spending limit', () => {
    const result = calculateOptimalStack(1000, availability, { maxCards: 100, dailyLimitUsd: 200, spentTodayUsd: 0 });
    expect(result.total_paid).toBeLessThanOrEqual(200);
    expect(result.capped).toBe(true);
  });

  it('accounts for already spent today', () => {
    const result = calculateOptimalStack(1000, availability, { maxCards: 100, dailyLimitUsd: 200, spentTodayUsd: 150 });
    expect(result.total_paid).toBeLessThanOrEqual(50);
    expect(result.capped).toBe(true);
  });

  it('returns empty stack when nothing available', () => {
    const result = calculateOptimalStack(100, [], { maxCards: 10, dailyLimitUsd: 500, spentTodayUsd: 0 });
    expect(result.cards).toHaveLength(0);
    expect(result.savings).toBe(0);
  });
});
