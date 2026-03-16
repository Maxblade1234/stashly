import type { InventoryAvailability, StackRecommendation, GiftCardOffer } from '@stashly/shared';

interface StackConstraints {
  maxCards: number | null;
  dailyLimitUsd: number;
  spentTodayUsd: number;
}

interface StackCandidate {
  cards: GiftCardOffer[];
  totalPaid: number;
  totalValue: number;
  cardCount: number;
}

/**
 * Greedy stack builder: fills with a given denomination list, then optionally
 * covers the remainder with the smallest adequate denomination.
 */
function buildStack(
  cartTotal: number,
  denoms: InventoryAvailability[],
  maxCards: number,
  budget: number
): StackCandidate {
  const cards: GiftCardOffer[] = [];
  let totalPaid = 0;
  let totalValue = 0;
  let cardCount = 0;
  let amountToCover = cartTotal;
  let budgetLeft = budget;

  // Phase 1: Fill with denominations that don't overshoot
  for (const denom of denoms) {
    if (amountToCover <= 0 || cardCount >= maxCards || budgetLeft < denom.price) continue;
    if (denom.denomination > amountToCover) continue;

    const neededByAmount = Math.floor(amountToCover / denom.denomination);
    const allowedByCardLimit = maxCards - cardCount;
    const allowedByBudget = Math.floor(budgetLeft / denom.price);
    const quantity = Math.min(neededByAmount, allowedByCardLimit, allowedByBudget);

    if (quantity > 0) {
      cards.push({
        denomination: denom.denomination,
        quantity,
        price_per_card: denom.price,
        total_price: Math.round(denom.price * quantity * 100) / 100,
        discount_percent: denom.discount_percent,
      });
      totalPaid += denom.price * quantity;
      totalValue += denom.denomination * quantity;
      cardCount += quantity;
      amountToCover -= denom.denomination * quantity;
      budgetLeft -= denom.price * quantity;
    }
  }

  // Phase 2: Cover the remainder with the smallest denomination >= remaining
  if (amountToCover > 0 && cardCount < maxCards) {
    const ascending = [...denoms].sort((a, b) => a.denomination - b.denomination);
    const coverCard = ascending.find(d => d.denomination >= amountToCover && d.price <= budgetLeft);
    if (coverCard) {
      cards.push({
        denomination: coverCard.denomination,
        quantity: 1,
        price_per_card: coverCard.price,
        total_price: coverCard.price,
        discount_percent: coverCard.discount_percent,
      });
      totalPaid += coverCard.price;
      totalValue += coverCard.denomination;
      cardCount += 1;
    }
  }

  return { cards, totalPaid: Math.round(totalPaid * 100) / 100, totalValue, cardCount };
}

export function calculateOptimalStack(
  cartTotal: number,
  availability: InventoryAvailability[],
  constraints: StackConstraints
): StackRecommendation {
  if (availability.length === 0) {
    return emptyStack(cartTotal, '');
  }

  const retailerName = availability[0].retailer_name;
  const maxCards = constraints.maxCards ?? Infinity;
  const remainingBudget = constraints.dailyLimitUsd - constraints.spentTodayUsd;

  const sorted = [...availability]
    .filter(a => a.available && a.price <= remainingBudget)
    .sort((a, b) => b.denomination - a.denomination);

  if (sorted.length === 0) {
    return emptyStack(cartTotal, retailerName);
  }

  // Strategy 1: Greedy fill (large cards first, then cover remainder)
  const greedy = buildStack(cartTotal, sorted, maxCards, remainingBudget);

  // Strategy 2: Single card cover (if one card can cover the whole amount)
  const ascending = [...sorted].sort((a, b) => a.denomination - b.denomination);
  const singleCover = ascending.find(d => d.denomination >= cartTotal && d.price <= remainingBudget);
  const singleCandidate: StackCandidate | null = singleCover ? {
    cards: [{
      denomination: singleCover.denomination,
      quantity: 1,
      price_per_card: singleCover.price,
      total_price: singleCover.price,
      discount_percent: singleCover.discount_percent,
    }],
    totalPaid: singleCover.price,
    totalValue: singleCover.denomination,
    cardCount: 1,
  } : null;

  // Pick the candidate with the lowest cost that covers the cart
  let best = greedy;
  if (singleCandidate && singleCandidate.totalValue >= cartTotal) {
    if (best.totalValue < cartTotal || singleCandidate.totalPaid < best.totalPaid) {
      best = singleCandidate;
    }
  }

  const totalPaid = best.totalPaid;
  const totalValue = best.totalValue;
  const savings = Math.round((totalValue - totalPaid) * 100) / 100;
  const residualBalance = Math.round(Math.max(0, totalValue - cartTotal) * 100) / 100;
  const remainingToPay = Math.round(Math.max(0, cartTotal - totalValue) * 100) / 100;

  let capped = false;
  let capReason: string | null = null;
  if (remainingToPay > 0) {
    capped = true;
    if (best.cardCount >= maxCards) {
      capReason = `Maximum ${maxCards} gift cards per order`;
    } else {
      capReason = `Daily purchase limit of $${constraints.dailyLimitUsd} reached`;
    }
  }

  return {
    retailer_name: retailerName,
    cart_total: cartTotal,
    cards: best.cards,
    total_paid: totalPaid,
    total_gift_card_value: totalValue,
    savings,
    savings_percent: totalValue > 0 ? Math.round((savings / totalValue) * 1000) / 10 : 0,
    residual_balance: residualBalance,
    remaining_to_pay: remainingToPay,
    capped,
    cap_reason: capReason,
  };
}

function emptyStack(cartTotal: number, retailerName: string): StackRecommendation {
  return {
    retailer_name: retailerName,
    cart_total: cartTotal,
    cards: [],
    total_paid: 0,
    total_gift_card_value: 0,
    savings: 0,
    savings_percent: 0,
    residual_balance: 0,
    remaining_to_pay: cartTotal,
    capped: false,
    cap_reason: null,
  };
}
