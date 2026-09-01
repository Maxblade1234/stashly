import type { MarketplaceQuote, RateComparison } from '@stashly/shared';
import { partnerProviders } from './providers/partners';
import { stashlyProvider } from './providers/stashly';
import { PROVIDER_TIMEOUT_MS, type MarketplaceProvider } from './types';

const CACHE_TTL_MS = 15 * 60 * 1000; // partner rates move slowly; 15 min is plenty
const cache = new Map<string, { comparison: Omit<RateComparison, 'cart_total' | 'estimated_savings'>; expires: number }>();

const allProviders: MarketplaceProvider[] = [stashlyProvider, ...partnerProviders];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('provider timeout')), ms)),
  ]);
}

/**
 * Rank quotes: higher discount wins; on a tie, instant fulfillment (Stashly)
 * beats an external link-out because the user gets the cards immediately.
 */
function rankQuotes(quotes: MarketplaceQuote[]): MarketplaceQuote[] {
  return [...quotes].sort((a, b) => {
    if (b.discount_percent !== a.discount_percent) return b.discount_percent - a.discount_percent;
    if (a.fulfillment !== b.fulfillment) return a.fulfillment === 'instant' ? -1 : 1;
    return a.source_label.localeCompare(b.source_label);
  });
}

async function fetchQuotes(retailerName: string): Promise<MarketplaceQuote[]> {
  const configured = allProviders.filter((p) => p.isConfigured());
  const results = await Promise.allSettled(
    configured.map((p) => withTimeout(p.getQuotes(retailerName), PROVIDER_TIMEOUT_MS))
  );

  // Degrade, don't break: a failed or slow provider drops out of the
  // comparison rather than sinking it. Stashly's own quote failing is the
  // only surprising case, and even then external quotes still render.
  return results.flatMap((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    console.warn(`[marketplace] ${configured[i].label} unavailable: ${(r.reason as Error).message}`);
    return [];
  });
}

/**
 * Compare rates for a retailer across Stashly inventory and all configured
 * partner marketplaces. `cartTotal`, when provided, adds a savings estimate
 * at the best rate (capped by that source's max card value coverage).
 */
export async function compareRates(retailerName: string, cartTotal?: number): Promise<RateComparison> {
  const key = retailerName.toLowerCase();
  const now = Date.now();
  const hit = cache.get(key);

  let base: Omit<RateComparison, 'cart_total' | 'estimated_savings'>;
  if (hit && hit.expires > now) {
    base = hit.comparison;
  } else {
    const quotes = rankQuotes(await fetchQuotes(retailerName));
    const best = quotes[0] ?? null;
    const stashlyQuote = quotes.find((q) => q.source === 'stashly') ?? null;
    const bestExternal = quotes.find((q) => q.fulfillment === 'external') ?? null;

    base = {
      retailer_name: retailerName,
      quotes,
      best,
      external_edge_pct:
        stashlyQuote && bestExternal
          ? Math.round((bestExternal.discount_percent - stashlyQuote.discount_percent) * 10) / 10
          : null,
      as_of: new Date().toISOString(),
    };
    cache.set(key, { comparison: base, expires: now + CACHE_TTL_MS });
  }

  return {
    ...base,
    cart_total: cartTotal ?? null,
    estimated_savings: cartTotal && base.best ? estimateSavings(cartTotal, base.best) : null,
  };
}

/**
 * Savings on a cart at a quote's rate. Coverage is bounded by how much of
 * the cart gift cards from this source can plausibly cover (a $2,000 cart
 * against a source whose largest card is $100 won't be fully covered in
 * one order — assume up to 5 cards, mirroring typical retailer limits).
 */
export function estimateSavings(cartTotal: number, quote: MarketplaceQuote): number {
  const maxCoverage = Math.min(cartTotal, quote.max_card_value * 5);
  return Math.round(maxCoverage * (quote.discount_percent / 100) * 100) / 100;
}

/** Test hook: clear the module-level rate cache. */
export function clearRateCache(): void {
  cache.clear();
}
