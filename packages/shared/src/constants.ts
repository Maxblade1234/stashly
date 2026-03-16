export const RESERVATION_EXPIRY_MINUTES = 10;
export const MAX_INVENTORY_CHECKS_PER_HOUR = 10;
export const MAX_PURCHASES_PER_HOUR = 3;
export const DEFAULT_DAILY_LIMIT_USD = 200;
export const RETAILER_CONFIG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const FIRST_PURCHASE_HOLD_HOURS = 24;

export const DEMO_CODE_PREFIX = 'DEMO';

export const STASHLY_MODE = {
  DEMO: 'demo',
  LIVE: 'live',
} as const;
