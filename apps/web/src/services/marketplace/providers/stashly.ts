import type { InventoryAvailability, MarketplaceQuote } from '@stashly/shared';
import { getAvailability } from '@/lib/inventory-client';
import type { MarketplaceProvider } from '../types';

/**
 * Stashly's own inventory as a marketplace provider. Unlike partners it is
 * fulfilled in-app (instant delivery, stacking, balances), so its quote
 * carries fulfillment: 'instant' and no external purchase URL.
 */
export const stashlyProvider: MarketplaceProvider = {
  source: 'stashly',
  label: 'Stashly',

  isConfigured() {
    return true;
  },

  async getQuotes(retailerName: string): Promise<MarketplaceQuote[]> {
    const availability: InventoryAvailability[] = await getAvailability(retailerName);
    const inStock = availability.filter((a) => a.available);
    if (inStock.length === 0) return [];

    const best = Math.max(...inStock.map((a) => a.discount_percent));
    const values = inStock.map((a) => a.denomination);

    return [
      {
        source: 'stashly',
        source_label: 'Stashly',
        via: null,
        retailer_name: retailerName,
        discount_percent: best,
        min_card_value: Math.min(...values),
        max_card_value: Math.max(...values),
        purchase_url: null,
        fulfillment: 'instant',
        verified_at: new Date().toISOString(),
      },
    ];
  },
};
