// Stashly Extension Configuration
const CONFIG = {
  // API endpoints
  API_BASE_URL: 'http://localhost:3000/api',
  WEBSITE_URL: 'http://localhost:3000',

  // Cache settings
  RETAILER_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  BALANCE_CACHE_TTL: 5 * 60 * 1000,   // 5 minutes

  // UI settings
  OVERLAY_DELAY_MS: 1500,
  AUTO_APPLY_RETRY_DELAY: 500,
  AUTO_APPLY_MAX_RETRIES: 3,
};

// Use production URLs if set
if (typeof STASHLY_API_URL !== 'undefined') {
  CONFIG.API_BASE_URL = STASHLY_API_URL;
}
if (typeof STASHLY_WEBSITE_URL !== 'undefined') {
  CONFIG.WEBSITE_URL = STASHLY_WEBSITE_URL;
}
