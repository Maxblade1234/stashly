import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from '../db';
import { encrypt } from '../encryption';
import { randomUUID } from 'node:crypto';

// Set test encryption key
process.env.CARD_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.INVENTORY_DB_PATH = ':memory:';

function seedCard(retailer: string, denomination: number, code: string, costPaid: number) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO inventory_cards (id, retailer_name, denomination, code_encrypted, cost_paid, status)
    VALUES (?, ?, ?, ?, ?, 'available')
  `).run(id, retailer, denomination, encrypt(code), costPaid);
  return id;
}

describe('checkAvailability', () => {
  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM inventory_audit_log').run();
    db.prepare('DELETE FROM inventory_cards').run();
  });

  it('returns available denominations without counts', async () => {
    seedCard('Apple', 50, 'APPLE-50-001', 44.50);
    seedCard('Apple', 50, 'APPLE-50-002', 44.50);
    seedCard('Apple', 100, 'APPLE-100-001', 89.50);

    const { checkAvailability } = await import('../routes/cards');
    const result = checkAvailability('Apple');

    expect(result).toEqual([
      { retailer_name: 'Apple', denomination: 50, available: true, discount_percent: expect.any(Number), price: expect.any(Number) },
      { retailer_name: 'Apple', denomination: 100, available: true, discount_percent: expect.any(Number), price: expect.any(Number) },
    ]);
  });

  it('returns empty array for unknown retailer', async () => {
    const { checkAvailability } = await import('../routes/cards');
    const result = checkAvailability('Unknown');
    expect(result).toEqual([]);
  });
});

describe('reserveCards', () => {
  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM inventory_audit_log').run();
    db.prepare('DELETE FROM inventory_cards').run();
  });

  it('reserves the requested cards atomically', async () => {
    seedCard('Apple', 100, 'APPLE-100-001', 89.50);
    seedCard('Apple', 50, 'APPLE-50-001', 44.50);

    const { reserveCards } = await import('../routes/cards');
    const result = reserveCards('Apple', [
      { denomination: 100, quantity: 1 },
      { denomination: 50, quantity: 1 },
    ], 'txn-123');

    expect(result.success).toBe(true);
    expect(result.reserved).toHaveLength(2);
  });

  it('fails if not enough inventory', async () => {
    seedCard('Apple', 100, 'APPLE-100-001', 89.50);

    const { reserveCards } = await import('../routes/cards');
    const result = reserveCards('Apple', [
      { denomination: 100, quantity: 2 },
    ], 'txn-456');

    expect(result.success).toBe(false);
  });
});

describe('releaseCards', () => {
  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM inventory_audit_log').run();
    db.prepare('DELETE FROM inventory_cards').run();
  });

  it('marks reserved cards as sold and returns decrypted codes', async () => {
    const id = seedCard('Apple', 100, 'APPLE-100-001', 89.50);
    const db = getDb();
    db.prepare(`UPDATE inventory_cards SET status = 'reserved', reserved_for_txn = ? WHERE id = ?`)
      .run('txn-789', id);

    const { releaseCards } = await import('../routes/cards');
    const result = releaseCards('txn-789');

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('APPLE-100-001');
    expect(result[0].denomination).toBe(100);

    const card = db.prepare('SELECT status FROM inventory_cards WHERE id = ?').get(id) as any;
    expect(card.status).toBe('sold');
  });
});
