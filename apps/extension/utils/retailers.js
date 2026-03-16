// Retailer Config Manager — caches retailer configs in chrome.storage.local

class RetailerManager {
  constructor() {
    this.cacheKey = 'stashly_retailers';
    this.cacheTimestampKey = 'stashly_retailers_ts';
  }

  async getRetailerForDomain(domain) {
    const retailers = await this._getCachedRetailers();
    return retailers.find(r =>
      domain === r.domain || domain.endsWith('.' + r.domain)
    ) || null;
  }

  async refreshConfigs() {
    try {
      const data = await api.getRetailers();
      const retailers = data.retailers || [];

      await chrome.storage.local.set({
        [this.cacheKey]: retailers,
        [this.cacheTimestampKey]: Date.now(),
      });

      return retailers;
    } catch (err) {
      console.error('[Stashly] Failed to refresh retailer configs:', err);
      return [];
    }
  }

  async _getCachedRetailers() {
    const result = await chrome.storage.local.get([this.cacheKey, this.cacheTimestampKey]);
    const cached = result[this.cacheKey];
    const timestamp = result[this.cacheTimestampKey];

    // Return cached if fresh
    if (cached && timestamp && (Date.now() - timestamp) < CONFIG.RETAILER_CACHE_TTL) {
      return cached;
    }

    // Refresh from API
    return this.refreshConfigs();
  }
}

const retailerManager = new RetailerManager();
