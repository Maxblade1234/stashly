// Stashly API Client
// Provides methods for the popup and other extension scripts to
// communicate with the Stashly backend.

const api = (function () {

  /**
   * Retrieve the stored auth token from chrome.storage.local.
   * Returns null if no token is found.
   */
  function getToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get('stashly_token', (result) => {
        resolve(result.stashly_token || null);
      });
    });
  }

  /**
   * Core fetch wrapper.
   * - Prepends CONFIG.API_BASE_URL to the endpoint
   * - Attaches Authorization header when a token is stored
   * - Sets Content-Type to application/json
   * - Returns parsed JSON on success
   * - Throws an error with status info on non-ok responses
   */
  async function fetchAPI(endpoint, options = {}) {
    const token = await getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const url = CONFIG.API_BASE_URL + endpoint;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const err = new Error(
        'API request failed: ' + response.status + ' ' + response.statusText
      );
      err.status = response.status;
      err.body = errorBody;
      throw err;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // --- Public API methods ---------------------------------------------------

  /**
   * Check whether the user is authenticated.
   * Verifies a stored token exists and is still valid by calling the server.
   * Returns { authenticated: boolean, user?: object, balances?: array }
   */
  async function checkAuth() {
    const token = await getToken();

    if (!token) {
      return { authenticated: false };
    }

    try {
      const data = await fetchAPI('/auth/me');
      return {
        authenticated: true,
        user: data.user || data,
        balances: data.balances || [],
      };
    } catch (err) {
      // Token expired or invalid - clear it
      if (err.status === 401) {
        await chrome.storage.local.remove('stashly_token');
      }
      return { authenticated: false };
    }
  }

  /**
   * GET /balances - list the user's gift-card balances.
   */
  function listBalances() {
    return fetchAPI('/balances');
  }

  /**
   * GET /retailers - list all available retailers.
   */
  function listRetailers() {
    return fetchAPI('/retailers');
  }

  /**
   * GET /transactions - list the user's purchase history.
   */
  function getTransactions() {
    return fetchAPI('/transactions');
  }

  /**
   * POST /purchase - buy a gift card.
   * @param {string} retailerName   - retailer display name
   * @param {number} denomination   - card value in dollars
   * @param {string} paymentMethodId - Stripe (or other) payment method id
   */
  function purchaseCard(retailerName, denomination, paymentMethodId) {
    return fetchAPI('/purchase', {
      method: 'POST',
      body: JSON.stringify({
        retailer_name: retailerName,
        denomination: denomination,
        payment_method_id: paymentMethodId,
      }),
    });
  }

  /**
   * GET /retailers?name=<name> - check availability / details for a
   * specific retailer.
   */
  function getAvailability(retailerName) {
    return fetchAPI('/retailers?name=' + encodeURIComponent(retailerName));
  }

  /**
   * POST /stack - compute the optimal gift-card stack for a cart total.
   */
  function getStack(retailerId, cartTotal) {
    return fetchAPI('/stack', {
      method: 'POST',
      body: JSON.stringify({ retailer_id: retailerId, cart_total: cartTotal }),
    });
  }

  /**
   * GET /rates - compare discount rates across Stashly inventory and
   * partner marketplaces (CardCash, Raise, GCX, GiftCardWiki).
   * Public endpoint; works logged out.
   */
  function getRates(retailerName, cartTotal) {
    let endpoint = '/rates?retailer=' + encodeURIComponent(retailerName);
    if (cartTotal > 0) {
      endpoint += '&cart_total=' + encodeURIComponent(cartTotal);
    }
    return fetchAPI(endpoint);
  }

  // Expose public interface
  return {
    checkAuth,
    listBalances,
    listRetailers,
    getTransactions,
    purchaseCard,
    getAvailability,
    getStack,
    getRates,
  };

})();
