import type { MarketplaceQuote, MarketplaceSource } from '@stashly/shared';

/**
 * A marketplace provider returns current discount quotes for one retailer.
 *
 * Mirrors the payment-adapter pattern: demo mode is served from fixtures,
 * live mode requires partner API credentials. Providers must throw (not
 * return fake data) when they cannot produce a real quote — the aggregator
 * treats a thrown provider as absent, never as authoritative.
 */
export interface MarketplaceProvider {
  source: MarketplaceSource;
  label: string;
  /** True when the provider can serve quotes in the current environment. */
  isConfigured(): boolean;
  getQuotes(retailerName: string): Promise<MarketplaceQuote[]>;
}

export const IS_DEMO = process.env.NEXT_PUBLIC_STASHLY_MODE === 'demo';

/** Per-provider timeout so one slow partner can't stall the comparison. */
export const PROVIDER_TIMEOUT_MS = 2500;
