import type { DeliveredCode } from '@stashly/shared';

/**
 * Sends purchased gift card codes to the Stashly Chrome extension
 * via window.postMessage for auto-apply at checkout.
 */
export function sendCodesToExtension(
  codes: DeliveredCode[],
  retailerName: string,
  retailerId: string
) {
  if (typeof window === 'undefined') return;

  // Wildcard origin ('*') is intentional here. The Chrome extension's content
  // script listens via window.addEventListener('message', ...) which requires
  // same-window messaging. The extension validates the message by checking
  // event.data.type === 'STASHLY_CODES_READY', so only Stashly messages are
  // acted upon. A restrictive targetOrigin would break this since the web app
  // origin differs from the retailer checkout page where the extension runs.
  window.postMessage(
    {
      type: 'STASHLY_CODES_READY',
      codes,
      retailer: {
        id: retailerId,
        name: retailerName,
      },
    },
    '*'
  );
}

/**
 * Checks if the Stashly extension is installed by looking for
 * the extension's injected element.
 */
export function isExtensionInstalled(): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.getElementById('stashly-overlay-root');
}
