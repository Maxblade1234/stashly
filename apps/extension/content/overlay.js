// Stashly Savings Overlay
// Renders a shadow DOM overlay showing savings opportunities at checkout

window.addEventListener('message', (event) => {
  if (event.data?.type === 'STASHLY_SHOW_OVERLAY') {
    createOverlay(event.data.data);
  }
});

function createOverlay(data) {
  // Remove existing overlay if any
  const existing = document.getElementById('stashly-overlay-root');
  if (existing) existing.remove();

  // Create shadow DOM container
  const host = document.createElement('div');
  host.id = 'stashly-overlay-root';
  host.style.cssText = 'all: initial; position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // Inject styles
  const style = document.createElement('style');
  style.textContent = getOverlayStyles();
  shadow.appendChild(style);

  // Build overlay content using safe DOM methods
  const card = document.createElement('div');
  card.className = 'stashly-card';

  if (!data.authenticated) {
    buildLoginPromptDOM(card, data.retailer);
  } else if (data.stack && data.stack.cards.length > 0) {
    buildSavingsOverlayDOM(card, data);
  } else if (data.balances && data.balances.length > 0) {
    buildBalanceOverlayDOM(card, data);
  } else {
    buildNoSavingsOverlayDOM(card, data.retailer);
  }

  shadow.appendChild(card);
  wireEvents(shadow, data);

  // Animate in
  requestAnimationFrame(() => {
    card.classList.add('stashly-visible');
  });
}

function createHeader() {
  const header = document.createElement('div');
  header.className = 'stashly-header';

  const logo = document.createElement('img');
  logo.src = chrome.runtime.getURL('icons/icon48.png');
  logo.className = 'stashly-logo';
  logo.alt = 'Stashly';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'stashly-close';
  closeBtn.dataset.action = 'close';
  closeBtn.textContent = '×';

  header.appendChild(logo);
  header.appendChild(closeBtn);
  return header;
}

function buildLoginPromptDOM(card, retailer) {
  card.appendChild(createHeader());

  const body = document.createElement('div');
  body.className = 'stashly-body';

  const title = document.createElement('p');
  title.className = 'stashly-title';
  title.textContent = `Save on ${retailer.name}!`;

  const subtitle = document.createElement('p');
  subtitle.className = 'stashly-subtitle';
  subtitle.textContent = 'Log in to Stashly to see your savings';

  const btn = document.createElement('button');
  btn.className = 'stashly-btn stashly-btn-primary';
  btn.dataset.action = 'login';
  btn.textContent = 'Log In to Save';

  body.appendChild(title);
  body.appendChild(subtitle);
  body.appendChild(btn);
  card.appendChild(body);
}

function buildSavingsOverlayDOM(card, data) {
  const { stack, retailer, balances } = data;
  card.appendChild(createHeader());

  const body = document.createElement('div');
  body.className = 'stashly-body';

  // Savings badge
  const badge = document.createElement('div');
  badge.className = 'stashly-savings-badge';

  const amount = document.createElement('span');
  amount.className = 'stashly-savings-amount';
  amount.textContent = `Save $${stack.savings.toFixed(2)}`;

  const percent = document.createElement('span');
  percent.className = 'stashly-savings-percent';
  percent.textContent = `${stack.savings_percent.toFixed(1)}% off`;

  badge.appendChild(amount);
  badge.appendChild(percent);
  body.appendChild(badge);

  // Subtitle
  const subtitle = document.createElement('p');
  subtitle.className = 'stashly-subtitle';
  subtitle.textContent = `${stack.cards.length} gift card${stack.cards.length > 1 ? 's' : ''} for ${retailer.name}`;
  body.appendChild(subtitle);

  // Stack summary
  const summary = document.createElement('div');
  summary.className = 'stashly-stack-summary';
  stack.cards.forEach(c => {
    const row = document.createElement('div');
    row.className = 'stashly-stack-row';

    const label = document.createElement('span');
    label.textContent = `${c.quantity}× $${c.denomination}`;

    const price = document.createElement('span');
    price.className = 'stashly-stack-price';
    price.textContent = `$${c.total_price.toFixed(2)}`;

    row.appendChild(label);
    row.appendChild(price);
    summary.appendChild(row);
  });
  body.appendChild(summary);

  // Balance if exists
  if (balances && balances.length > 0) {
    const balDiv = document.createElement('div');
    balDiv.className = 'stashly-balance';
    const balLabel = document.createElement('span');
    balLabel.textContent = 'Stashly Balance:';
    const balAmount = document.createElement('strong');
    balAmount.textContent = `$${balances[0].balance.toFixed(2)}`;
    balDiv.appendChild(balLabel);
    balDiv.appendChild(balAmount);
    body.appendChild(balDiv);
  }

  // CTA button
  const btn = document.createElement('button');
  btn.className = 'stashly-btn stashly-btn-primary';
  btn.dataset.action = 'purchase';
  btn.textContent = `Save $${stack.savings.toFixed(2)} Now`;

  body.appendChild(btn);
  card.appendChild(body);
}

function buildBalanceOverlayDOM(card, data) {
  const balance = data.balances[0];
  card.appendChild(createHeader());

  const body = document.createElement('div');
  body.className = 'stashly-body';

  const title = document.createElement('p');
  title.className = 'stashly-title';
  title.textContent = 'Stashly Balance Available';

  const balDiv = document.createElement('div');
  balDiv.className = 'stashly-balance';
  const balLabel = document.createElement('span');
  balLabel.textContent = `${data.retailer.name}:`;
  const balAmount = document.createElement('strong');
  balAmount.textContent = `$${balance.balance.toFixed(2)}`;
  balDiv.appendChild(balLabel);
  balDiv.appendChild(balAmount);

  const subtitle = document.createElement('p');
  subtitle.className = 'stashly-subtitle';
  subtitle.textContent = 'You have a Stashly balance for this retailer';

  const btn = document.createElement('button');
  btn.className = 'stashly-btn stashly-btn-secondary';
  btn.dataset.action = 'dashboard';
  btn.textContent = 'View Dashboard';

  body.appendChild(title);
  body.appendChild(balDiv);
  body.appendChild(subtitle);
  body.appendChild(btn);
  card.appendChild(body);
}

function buildNoSavingsOverlayDOM(card, retailer) {
  card.appendChild(createHeader());

  const body = document.createElement('div');
  body.className = 'stashly-body';

  const title = document.createElement('p');
  title.className = 'stashly-title';
  title.textContent = retailer.name;

  const subtitle = document.createElement('p');
  subtitle.className = 'stashly-subtitle';
  subtitle.textContent = 'No savings available right now. Check back later!';

  body.appendChild(title);
  body.appendChild(subtitle);
  card.appendChild(body);
}

function wireEvents(shadow, data) {
  shadow.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;

      switch (action) {
        case 'close':
          document.getElementById('stashly-overlay-root')?.remove();
          break;

        case 'login':
          window.open(`${getWebsiteUrl()}/login`, '_blank');
          break;

        case 'purchase':
          chrome.runtime.sendMessage({
            type: 'OPEN_PURCHASE',
            retailerId: data.retailer.id,
            cartTotal: data.cartTotal,
          });
          break;

        case 'dashboard':
          window.open(`${getWebsiteUrl()}/dashboard`, '_blank');
          break;
      }
    });
  });
}

function getWebsiteUrl() {
  return 'http://localhost:3000';
}

function getOverlayStyles() {
  return `
    .stashly-card {
      width: 320px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transform: translateY(20px);
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .stashly-card.stashly-visible {
      transform: translateY(0);
      opacity: 1;
    }
    .stashly-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
    }
    .stashly-logo {
      width: 24px;
      height: 24px;
    }
    .stashly-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    }
    .stashly-close:hover {
      color: #374151;
    }
    .stashly-body {
      padding: 16px;
    }
    .stashly-title {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px;
    }
    .stashly-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 0 0 12px;
    }
    .stashly-savings-badge {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;
    }
    .stashly-savings-amount {
      font-size: 22px;
      font-weight: 800;
      color: #00C853;
    }
    .stashly-savings-percent {
      font-size: 13px;
      font-weight: 600;
      color: #00C853;
      background: #e8faf0;
      padding: 2px 8px;
      border-radius: 20px;
    }
    .stashly-stack-summary {
      background: #f9fafb;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .stashly-stack-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #374151;
      padding: 3px 0;
    }
    .stashly-stack-price {
      font-weight: 600;
      font-family: 'IBM Plex Mono', monospace;
    }
    .stashly-balance {
      display: flex;
      justify-content: space-between;
      background: #eff6ff;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      color: #1d4ed8;
      margin-bottom: 12px;
    }
    .stashly-btn {
      display: block;
      width: 100%;
      padding: 10px 16px;
      border: none;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
    }
    .stashly-btn-primary {
      background: #2B3FE0;
      color: white;
    }
    .stashly-btn-primary:hover {
      background: #2235c0;
      box-shadow: 0 4px 12px rgba(43,63,224,0.3);
    }
    .stashly-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    .stashly-btn-secondary:hover {
      background: #e5e7eb;
    }
  `;
}
