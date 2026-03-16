const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
const SERVICE_KEY = process.env.INVENTORY_SERVICE_API_KEY || '';
const IS_DEMO = process.env.NEXT_PUBLIC_STASHLY_MODE === 'demo';

// Demo mock availability — matches InventoryAvailability from @stashly/shared
function getMockAvailability(retailerName: string) {
  return [
    { retailer_name: retailerName, denomination: 10, available: true, discount_percent: 15, price: 8.50 },
    { retailer_name: retailerName, denomination: 25, available: true, discount_percent: 13, price: 21.75 },
    { retailer_name: retailerName, denomination: 50, available: true, discount_percent: 13, price: 43.50 },
    { retailer_name: retailerName, denomination: 100, available: true, discount_percent: 13, price: 87.00 },
  ];
}

async function inventoryFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${INVENTORY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-service-key': SERVICE_KEY,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Inventory service error: ${res.status}`);
  }
  return res.json();
}

export async function getAvailability(retailerName: string) {
  if (IS_DEMO) {
    return getMockAvailability(retailerName);
  }
  return inventoryFetch(`/cards/availability/${encodeURIComponent(retailerName)}`);
}

export async function reserveCards(
  retailerName: string,
  cards: { denomination: number; quantity: number }[],
  transactionId: string
) {
  return inventoryFetch('/cards/reserve', {
    method: 'POST',
    body: JSON.stringify({ retailer_name: retailerName, cards, transaction_id: transactionId }),
  });
}

export async function releaseCards(transactionId: string) {
  return inventoryFetch('/cards/release', {
    method: 'POST',
    body: JSON.stringify({ transaction_id: transactionId }),
  });
}

export async function unreserveCards(transactionId: string) {
  return inventoryFetch('/cards/unreserve', {
    method: 'POST',
    body: JSON.stringify({ transaction_id: transactionId }),
  });
}
