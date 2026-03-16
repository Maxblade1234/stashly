// Stashly Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const loggedOutEl = document.getElementById('logged-out');
  const loggedInEl = document.getElementById('logged-in');

  try {
    // Check authentication
    const auth = await api.checkAuth();

    loadingEl.style.display = 'none';

    if (!auth.authenticated) {
      loggedOutEl.style.display = 'block';
    } else {
      loggedInEl.style.display = 'block';

      // Show balances if any
      const balances = auth.balances || [];
      if (balances.length > 0) {
        document.getElementById('balances-section').style.display = 'block';
        const list = document.getElementById('balances-list');

        balances.forEach(b => {
          const row = document.createElement('div');
          row.className = 'popup-balance-row';

          const name = document.createElement('span');
          name.className = 'popup-balance-name';
          name.textContent = b.retailer_name;

          const amount = document.createElement('span');
          amount.className = 'popup-balance-amount';
          amount.textContent = `$${b.balance.toFixed(2)}`;

          row.appendChild(name);
          row.appendChild(amount);
          list.appendChild(row);
        });

        // Calculate total savings from balances (approximation)
        const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
        document.getElementById('total-savings').textContent = `$${totalBalance.toFixed(2)}`;
      }
    }
  } catch (err) {
    console.error('[Stashly Popup] Error:', err);
    loadingEl.style.display = 'none';
    loggedOutEl.style.display = 'block';
  }

  // Event listeners
  document.getElementById('login-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${CONFIG.WEBSITE_URL}/login` });
  });

  document.getElementById('signup-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${CONFIG.WEBSITE_URL}/signup` });
  });

  document.getElementById('dashboard-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${CONFIG.WEBSITE_URL}/dashboard` });
  });

  document.getElementById('gift-cards-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${CONFIG.WEBSITE_URL}/gift-cards` });
  });
});
