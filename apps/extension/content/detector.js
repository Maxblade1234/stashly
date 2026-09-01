// Stashly Checkout Detector
// Detects supported retailers on checkout pages and triggers savings overlay

(async function stashlyDetector() {
  // Don't run in iframes
  if (window !== window.top) return;

  const domain = window.location.hostname.replace(/^www\./, '');

  // Check if this domain has a supported retailer
  const response = await chrome.runtime.sendMessage({
    type: 'CHECK_RETAILER',
    domain,
  });

  if (!response || !response.retailer) return;

  const retailer = response.retailer;
  console.debug('[Stashly] Detected retailer:', retailer.name);

  // Check if we're on a checkout page
  const currentUrl = window.location.href;
  const isCheckout = retailer.checkout_url_patterns.some(pattern => {
    try {
      const regex = new RegExp(pattern);
      return regex.test(currentUrl);
    } catch {
      return currentUrl.includes(pattern);
    }
  });

  if (!isCheckout) {
    console.debug('[Stashly] Not a checkout page, skipping');
    return;
  }

  console.debug('[Stashly] Checkout page detected!');

  // Try to read cart total
  let cartTotal = 0;
  for (const selector of retailer.cart_total_selectors) {
    try {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent.replace(/[^0-9.]/g, '');
        const parsed = parseFloat(text);
        if (parsed > 0) {
          cartTotal = parsed;
          break;
        }
      }
    } catch (e) {
      console.warn('[Stashly] Selector failed:', selector, e);
    }
  }

  if (cartTotal <= 0) {
    console.debug('[Stashly] Could not read cart total, using manual entry mode');
  }

  // Wait a moment for page to settle
  await new Promise(r => setTimeout(r, CONFIG.OVERLAY_DELAY_MS || 1500));

  // Check auth status
  const auth = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });

  // Marketplace rate comparison (Stashly inventory + partner marketplaces).
  // Public data — fetched regardless of auth state.
  let rates = null;
  try {
    const ratesResponse = await chrome.runtime.sendMessage({
      type: 'GET_RATES',
      retailerName: retailer.name,
      cartTotal,
    });
    rates = ratesResponse.comparison || null;
  } catch (err) {
    console.debug('[Stashly] Rate comparison unavailable:', err);
  }

  if (!auth.authenticated) {
    // Show login prompt overlay (with market rates if we have them)
    injectOverlay({
      retailer,
      authenticated: false,
      cartTotal,
      rates,
    });
    return;
  }

  // Fetch savings stack if we have a cart total
  let stack = null;
  if (cartTotal > 0) {
    try {
      const stackResponse = await chrome.runtime.sendMessage({
        type: 'GET_STACK',
        retailerId: retailer.id,
        cartTotal,
      });
      stack = stackResponse.stack;
    } catch (err) {
      console.error('[Stashly] Failed to get stack:', err);
    }
  }

  // Check existing Stashly balances
  let balances = [];
  try {
    const balanceResponse = await chrome.runtime.sendMessage({ type: 'GET_BALANCES' });
    balances = (balanceResponse.balances || []).filter(b =>
      b.retailer_id === retailer.id && b.balance > 0
    );
  } catch (err) {
    console.error('[Stashly] Failed to get balances:', err);
  }

  // Inject the overlay
  injectOverlay({
    retailer,
    authenticated: true,
    cartTotal,
    stack,
    balances,
    rates,
  });
})();

function injectOverlay(data) {
  // Dynamic import of overlay module
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/overlay.js');
  script.onload = () => {
    window.postMessage({ type: 'STASHLY_SHOW_OVERLAY', data }, '*');
  };
  (document.head || document.documentElement).appendChild(script);
}
