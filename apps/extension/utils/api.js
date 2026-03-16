// Stashly API Client for Chrome Extension

class StashlyAPI {
  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
  }

  async _fetch(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      credentials: 'include', // Send cookies for auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getRetailers() {
    return this._fetch('/retailers');
  }

  async getStack(retailerId, cartTotal) {
    return this._fetch('/stack', {
      method: 'POST',
      body: JSON.stringify({ retailer_id: retailerId, cart_total: cartTotal }),
    });
  }

  async getBalances() {
    return this._fetch('/balances');
  }

  async checkAuth() {
    try {
      const data = await this._fetch('/balances');
      return { authenticated: true, balances: data.balances };
    } catch {
      return { authenticated: false, balances: [] };
    }
  }
}

const api = new StashlyAPI();
