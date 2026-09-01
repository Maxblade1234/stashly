import type { MarketplaceSource } from '@stashly/shared';

/**
 * Demo-mode rate fixtures, modeled on typical secondary-market discounts:
 * thin on Apple/eBay (high resale liquidity), fat on restaurant cards.
 *
 * GiftCardWiki is itself an aggregator, so its fixture carries `via` — the
 * underlying seller its best rate came from. Live mode replaces all of this
 * with partner API calls; these numbers exist only so demo mode exercises
 * the real comparison logic.
 */
export interface RateFixture {
  discount_percent: number;
  min_card_value: number;
  max_card_value: number;
  via?: string;
}

type FixtureTable = Record<string, Partial<Record<MarketplaceSource, RateFixture>>>;

export const DEMO_RATES: FixtureTable = {
  Apple: {
    cardcash: { discount_percent: 4.5, min_card_value: 10, max_card_value: 500 },
    raise: { discount_percent: 3.8, min_card_value: 15, max_card_value: 200 },
    gcx: { discount_percent: 4.1, min_card_value: 10, max_card_value: 250 },
    giftcardwiki: { discount_percent: 5.2, min_card_value: 10, max_card_value: 500, via: 'CardDepot' },
  },
  Chipotle: {
    cardcash: { discount_percent: 9.5, min_card_value: 5, max_card_value: 200 },
    raise: { discount_percent: 8.7, min_card_value: 10, max_card_value: 100 },
    gcx: { discount_percent: 9.0, min_card_value: 5, max_card_value: 150 },
    giftcardwiki: { discount_percent: 10.1, min_card_value: 5, max_card_value: 200, via: 'GCX' },
  },
  Dominos: {
    cardcash: { discount_percent: 13.0, min_card_value: 5, max_card_value: 100 },
    raise: { discount_percent: 11.5, min_card_value: 10, max_card_value: 100 },
    gcx: { discount_percent: 12.2, min_card_value: 5, max_card_value: 100 },
    giftcardwiki: { discount_percent: 13.8, min_card_value: 5, max_card_value: 100, via: 'CardCash' },
  },
  eBay: {
    cardcash: { discount_percent: 3.5, min_card_value: 25, max_card_value: 500 },
    raise: { discount_percent: 2.9, min_card_value: 25, max_card_value: 200 },
    gcx: { discount_percent: 3.2, min_card_value: 25, max_card_value: 300 },
    giftcardwiki: { discount_percent: 4.0, min_card_value: 25, max_card_value: 500, via: 'CardCash' },
  },
  'New Era': {
    cardcash: { discount_percent: 10.5, min_card_value: 10, max_card_value: 150 },
    raise: { discount_percent: 9.8, min_card_value: 10, max_card_value: 100 },
    gcx: { discount_percent: 10.0, min_card_value: 10, max_card_value: 150 },
    giftcardwiki: { discount_percent: 11.2, min_card_value: 10, max_card_value: 150, via: 'GCX' },
  },
  'NFL Shop': {
    cardcash: { discount_percent: 8.5, min_card_value: 10, max_card_value: 250 },
    raise: { discount_percent: 7.9, min_card_value: 10, max_card_value: 200 },
    gcx: { discount_percent: 8.2, min_card_value: 10, max_card_value: 200 },
    giftcardwiki: { discount_percent: 9.4, min_card_value: 10, max_card_value: 250, via: 'CardCash' },
  },
  'Jersey Mikes': {
    cardcash: { discount_percent: 11.0, min_card_value: 5, max_card_value: 100 },
    raise: { discount_percent: 10.2, min_card_value: 5, max_card_value: 100 },
    gcx: { discount_percent: 10.6, min_card_value: 5, max_card_value: 100 },
    giftcardwiki: { discount_percent: 12.0, min_card_value: 5, max_card_value: 100, via: 'GCX' },
  },
  Fanatics: {
    cardcash: { discount_percent: 9.0, min_card_value: 10, max_card_value: 250 },
    raise: { discount_percent: 8.4, min_card_value: 10, max_card_value: 200 },
    gcx: { discount_percent: 8.8, min_card_value: 10, max_card_value: 200 },
    giftcardwiki: { discount_percent: 9.8, min_card_value: 10, max_card_value: 250, via: 'CardCash' },
  },
  'Off Season': {
    giftcardwiki: { discount_percent: 6.5, min_card_value: 25, max_card_value: 100, via: 'Cardtopia' },
  },
  'Riot Games': {
    cardcash: { discount_percent: 6.0, min_card_value: 10, max_card_value: 200 },
    gcx: { discount_percent: 5.5, min_card_value: 10, max_card_value: 100 },
    giftcardwiki: { discount_percent: 6.8, min_card_value: 10, max_card_value: 200, via: 'CardCash' },
  },
};

/** Public storefront URL for a retailer's cards on each marketplace (affiliate params added at link time). */
export function storefrontUrl(source: MarketplaceSource, retailerName: string): string | null {
  const slug = retailerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  switch (source) {
    case 'cardcash':
      return `https://www.cardcash.com/buy-gift-cards/${slug}/`;
    case 'raise':
      return `https://www.raise.com/buy-${slug}-gift-cards`;
    case 'gcx':
      return `https://gcx.raise.com/buy-gift-cards/${slug}`;
    case 'giftcardwiki':
      return `https://www.giftcardwiki.com/search?q=${encodeURIComponent(retailerName)}`;
    case 'stashly':
      return null;
  }
}
