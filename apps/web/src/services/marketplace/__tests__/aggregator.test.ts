import { describe, it, expect, beforeEach, vi } from 'vitest';

async function loadDemoAggregator() {
  vi.resetModules();
  process.env.NEXT_PUBLIC_STASHLY_MODE = 'demo';
  return import('../aggregator');
}

describe('compareRates (demo mode)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('merges Stashly inventory with all partner marketplaces, sorted best first', async () => {
    const { compareRates, clearRateCache } = await loadDemoAggregator();
    clearRateCache();

    const result = await compareRates('Dominos', 60);

    const sources = result.quotes.map((q) => q.source);
    expect(sources).toContain('stashly');
    expect(sources).toContain('cardcash');
    expect(sources).toContain('raise');
    expect(sources).toContain('gcx');
    expect(sources).toContain('giftcardwiki');

    for (let i = 1; i < result.quotes.length; i++) {
      expect(result.quotes[i - 1].discount_percent).toBeGreaterThanOrEqual(
        result.quotes[i].discount_percent
      );
    }
    expect(result.best).toEqual(result.quotes[0]);
  });

  it('reports how far the best external rate is from Stashly', async () => {
    const { compareRates, clearRateCache } = await loadDemoAggregator();
    clearRateCache();

    const result = await compareRates('Dominos');
    const stashly = result.quotes.find((q) => q.source === 'stashly')!;
    const bestExternal = result.quotes.find((q) => q.fulfillment === 'external')!;

    expect(result.external_edge_pct).toBeCloseTo(
      bestExternal.discount_percent - stashly.discount_percent,
      1
    );
  });

  it('estimates cart savings at the best rate', async () => {
    const { compareRates, clearRateCache } = await loadDemoAggregator();
    clearRateCache();

    const result = await compareRates('Chipotle', 100);
    expect(result.cart_total).toBe(100);
    expect(result.estimated_savings).toBeCloseTo(
      100 * (result.best!.discount_percent / 100),
      2
    );
  });

  it('caps the savings estimate by the source max card coverage', async () => {
    const { estimateSavings } = await loadDemoAggregator();

    const quote = {
      source: 'cardcash' as const,
      source_label: 'CardCash',
      via: null,
      retailer_name: 'Dominos',
      discount_percent: 10,
      min_card_value: 5,
      max_card_value: 100,
      purchase_url: 'https://example.com',
      fulfillment: 'external' as const,
      verified_at: new Date().toISOString(),
    };

    // $2,000 cart, $100 max card, 5-card assumption → $500 covered → $50 saved
    expect(estimateSavings(2000, quote)).toBe(50);
    // Small cart is fully covered
    expect(estimateSavings(80, quote)).toBe(8);
  });

  it('marks external quotes with purchase URLs and Stashly as instant', async () => {
    const { compareRates, clearRateCache } = await loadDemoAggregator();
    clearRateCache();

    const result = await compareRates('Fanatics');
    for (const q of result.quotes) {
      if (q.source === 'stashly') {
        expect(q.fulfillment).toBe('instant');
        expect(q.purchase_url).toBeNull();
      } else {
        expect(q.fulfillment).toBe('external');
        expect(q.purchase_url).toMatch(/^https:\/\//);
      }
    }
    const wiki = result.quotes.find((q) => q.source === 'giftcardwiki')!;
    expect(wiki.via).toBeTruthy();
  });

  it('serves repeat lookups for a retailer from cache', async () => {
    const { compareRates, clearRateCache } = await loadDemoAggregator();
    clearRateCache();

    const first = await compareRates('Apple', 500);
    const second = await compareRates('Apple', 250);

    expect(second.as_of).toBe(first.as_of);
    // cart-dependent fields still recompute per call
    expect(second.cart_total).toBe(250);
    expect(second.estimated_savings).not.toBe(first.estimated_savings);
  });

  it('still returns a comparison when a retailer has no partner coverage', async () => {
    const { compareRates, clearRateCache } = await loadDemoAggregator();
    clearRateCache();

    const result = await compareRates('Some Unknown Brand');
    // Stashly demo inventory quotes any retailer; partners have no fixture
    expect(result.quotes.length).toBe(1);
    expect(result.quotes[0].source).toBe('stashly');
    expect(result.best!.source).toBe('stashly');
    expect(result.external_edge_pct).toBeNull();
  });
});
