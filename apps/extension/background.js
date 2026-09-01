// Stashly Background Service Worker
importScripts('utils/config.js', 'utils/api.js', 'utils/retailers.js');

// Message handler for content script requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('[Stashly BG] Error:', err);
    sendResponse({ error: err.message });
  });

  // Return true to keep the message channel open for async response
  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    case 'CHECK_RETAILER': {
      const domain = message.domain;
      const retailer = await retailerManager.getRetailerForDomain(domain);
      return { retailer };
    }

    case 'GET_STACK': {
      const data = await api.getStack(message.retailerId, message.cartTotal);
      return data;
    }

    case 'GET_BALANCES': {
      const data = await api.getBalances();
      return { balances: data.balances || [] };
    }

    case 'CHECK_AUTH': {
      const authStatus = await api.checkAuth();
      return authStatus;
    }

    case 'OPEN_PURCHASE': {
      const purchaseUrl = `${CONFIG.WEBSITE_URL}/gift-cards/buy?retailer=${message.retailerId}&amount=${message.cartTotal}`;
      await chrome.tabs.create({ url: purchaseUrl });
      return { opened: true };
    }

    default:
      return { error: 'Unknown message type' };
  }
}

// Refresh retailer configs on install/update
chrome.runtime.onInstalled.addListener(() => {
  console.debug('[Stashly] Extension installed/updated');
  retailerManager.refreshConfigs();
});

// Periodic refresh of retailer configs (every 4 hours)
chrome.alarms.create('refreshRetailers', { periodInMinutes: 240 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshRetailers') {
    retailerManager.refreshConfigs();
  }
});
