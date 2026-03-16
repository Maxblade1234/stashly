// Stashly Auto-Apply
// Listens for delivered codes and automatically applies them at checkout

window.addEventListener('message', async (event) => {
  if (event.data?.type !== 'STASHLY_CODES_READY') return;

  const { codes, retailer } = event.data;
  if (!codes || !codes.length || !retailer) return;

  console.log('[Stashly Auto-Apply] Received codes for', retailer.name);

  // Get retailer config for selectors
  const response = await chrome.runtime.sendMessage({
    type: 'CHECK_RETAILER',
    domain: window.location.hostname.replace(/^www\./, ''),
  });

  if (!response?.retailer) {
    console.warn('[Stashly Auto-Apply] No retailer config found');
    showFallbackPanel(codes);
    return;
  }

  const config = response.retailer;
  let appliedCount = 0;

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const success = await applyCode(config, code, i > 0);

    if (success) {
      appliedCount++;
      console.log(`[Stashly Auto-Apply] Applied code ${i + 1}/${codes.length}`);
    } else {
      console.warn(`[Stashly Auto-Apply] Failed to apply code ${i + 1}, showing fallback`);
      showFallbackPanel(codes.slice(i));
      break;
    }
  }

  if (appliedCount === codes.length) {
    showSuccessNotification(appliedCount);
  }
});

async function applyCode(config, code, needsAddAnother) {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Click "Add another gift card" if needed
      if (needsAddAnother && config.add_another_selector) {
        const addBtn = document.querySelector(config.add_another_selector);
        if (addBtn) {
          addBtn.click();
          await delay(500);
        }
      }

      // Find gift card input
      const input = document.querySelector(config.gift_card_input_selector);
      if (!input) {
        await delay(500);
        continue;
      }

      // Fill the code
      input.focus();
      input.value = '';
      input.value = code.code;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      // Fill PIN if needed
      if (code.pin && config.gift_card_pin_selector) {
        const pinInput = document.querySelector(config.gift_card_pin_selector);
        if (pinInput) {
          pinInput.focus();
          pinInput.value = code.pin;
          pinInput.dispatchEvent(new Event('input', { bubbles: true }));
          pinInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      await delay(200);

      // Click apply button
      const applyBtn = document.querySelector(config.apply_button_selector);
      if (applyBtn) {
        applyBtn.click();
        await delay(1000);
        return true;
      }
    } catch (err) {
      console.error('[Stashly Auto-Apply] Attempt failed:', err);
    }

    await delay(500);
  }

  return false;
}

function showFallbackPanel(remainingCodes) {
  // Remove existing overlay
  const existing = document.getElementById('stashly-overlay-root');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'stashly-overlay-root';
  host.style.cssText = 'all: initial; position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .panel { width: 300px; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; position: relative; }
    .title { font-size: 14px; font-weight: 700; color: #111; margin: 0 0 4px; }
    .subtitle { font-size: 12px; color: #666; margin: 0 0 12px; }
    .code-row { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; border-radius: 8px; padding: 8px 12px; margin-bottom: 6px; }
    .code { font-family: monospace; font-size: 13px; font-weight: 600; color: #111; }
    .copy-btn { background: #2B3FE0; color: white; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .copy-btn:hover { background: #2235c0; }
    .close { position: absolute; top: 8px; right: 12px; background: none; border: none; font-size: 18px; color: #999; cursor: pointer; }
  `;
  shadow.appendChild(style);

  // Build panel using safe DOM methods
  const panel = document.createElement('div');
  panel.className = 'panel';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => host.remove());
  panel.appendChild(closeBtn);

  const title = document.createElement('p');
  title.className = 'title';
  title.textContent = 'Copy Your Gift Card Codes';
  panel.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'subtitle';
  subtitle.textContent = "Auto-apply couldn't complete. Copy and paste manually:";
  panel.appendChild(subtitle);

  remainingCodes.forEach(c => {
    const row = document.createElement('div');
    row.className = 'code-row';

    const codeSpan = document.createElement('span');
    codeSpan.className = 'code';
    codeSpan.textContent = c.code;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(c.code);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });

    row.appendChild(codeSpan);
    row.appendChild(copyBtn);
    panel.appendChild(row);
  });

  shadow.appendChild(panel);
}

function showSuccessNotification(count) {
  const existing = document.getElementById('stashly-overlay-root');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'stashly-overlay-root';
  host.style.cssText = 'all: initial; position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .notif { background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); padding: 14px 18px; font-family: -apple-system, sans-serif; display: flex; align-items: center; gap: 10px; }
    .check { width: 28px; height: 28px; background: #e8faf0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #00C853; font-size: 16px; }
    .text { font-size: 13px; font-weight: 600; color: #111; }
  `;
  shadow.appendChild(style);

  const notif = document.createElement('div');
  notif.className = 'notif';

  const check = document.createElement('div');
  check.className = 'check';
  check.textContent = '✓';

  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = `${count} gift card${count > 1 ? 's' : ''} applied!`;

  notif.appendChild(check);
  notif.appendChild(text);
  shadow.appendChild(notif);

  // Auto-dismiss
  setTimeout(() => host.remove(), 5000);
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
