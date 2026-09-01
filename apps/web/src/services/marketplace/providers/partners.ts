import type { MarketplaceQuote, MarketplaceSource } from '@stashly/shared';
import { DEMO_RATES, storefrontUrl } from '../fixtures';
import { IS_DEMO, type MarketplaceProvider } from '../types';

/**
 * Partner marketplace providers (CardCash, Raise, GCX, GiftCardWiki).
 *
 * Live mode requires partner API credentials — none of these marketplaces
 * offer open public APIs, and scraping their sites is off the table (breaks
 * their terms, and breaks silently). Until partnership/affiliate agreements
 * exist, a provider without credentials reports isConfigured() === false in
 * live mode and is simply absent from the comparison.
 */

interface PartnerSpec {
  source: MarketplaceSource;
  label: string;
  /** Env var that would hold live API credentials. */
  credentialEnv: string;
}

const PARTNERS: PartnerSpec[] = [
  { source: 'cardcash', label: 'CardCash', credentialEnv: 'CARDCASH_API_KEY' },
  { source: 'raise', label: 'Raise', credentialEnv: 'RAISE_API_KEY' },
  { source: 'gcx', label: 'GCX', credentialEnv: 'GCX_API_KEY' },
  { source: 'giftcardwiki', label: 'GiftCardWiki', credentialEnv: 'GIFTCARDWIKI_API_KEY' },
];

function makePartnerProvider(spec: PartnerSpec): MarketplaceProvider {
  return {
    source: spec.source,
    label: spec.label,

    isConfigured() {
      return IS_DEMO || Boolean(process.env[spec.credentialEnv]);
    },

    async getQuotes(retailerName: string): Promise<MarketplaceQuote[]> {
      if (IS_DEMO) {
        const fixture = DEMO_RATES[retailerName]?.[spec.source];
        if (!fixture) return [];
        return [
          {
            source: spec.source,
            source_label: spec.label,
            via: fixture.via ?? null,
            retailer_name: retailerName,
            discount_percent: fixture.discount_percent,
            min_card_value: fixture.min_card_value,
            max_card_value: fixture.max_card_value,
            purchase_url: storefrontUrl(spec.source, retailerName),
            fulfillment: 'external',
            verified_at: new Date().toISOString(),
          },
        ];
      }

      // Live mode: call the partner rate API once credentials exist.
      // Each partner integration lands here behind the same interface.
      throw new Error(`${spec.label} live integration requires ${spec.credentialEnv} and a partner agreement`);
    },
  };
}

export const partnerProviders: MarketplaceProvider[] = PARTNERS.map(makePartnerProvider);
