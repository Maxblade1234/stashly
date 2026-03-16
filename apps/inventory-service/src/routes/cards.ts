import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { decrypt } from '../encryption';
import { randomUUID } from 'node:crypto';

const router = Router();

export function checkAvailability(retailerName: string) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT denomination, MIN(cost_paid) as min_cost
    FROM inventory_cards
    WHERE retailer_name = ? AND status = 'available'
    GROUP BY denomination
    ORDER BY denomination
  `).all(retailerName) as { denomination: number; min_cost: number }[];

  return rows.map(row => ({
    retailer_name: retailerName,
    denomination: row.denomination,
    available: true,
    discount_percent: Math.round((1 - row.min_cost / row.denomination) * 100 * 10) / 10,
    price: row.min_cost,
  }));
}

export function reserveCards(
  retailerName: string,
  requests: { denomination: number; quantity: number }[],
  transactionId: string
) {
  const db = getDb();
  const reserved: string[] = [];

  const reserveOne = db.prepare(`
    UPDATE inventory_cards
    SET status = 'reserved', reserved_at = datetime('now'), reserved_for_txn = ?
    WHERE id = (
      SELECT id FROM inventory_cards
      WHERE retailer_name = ? AND denomination = ? AND status = 'available'
      LIMIT 1
    )
  `);

  const logAction = db.prepare(`
    INSERT INTO inventory_audit_log (id, card_id, action, performed_by)
    VALUES (?, ?, 'reserved', ?)
  `);

  const transaction = db.transaction(() => {
    for (const req of requests) {
      for (let i = 0; i < req.quantity; i++) {
        const result = reserveOne.run(transactionId, retailerName, req.denomination);
        if (result.changes === 0) {
          throw new Error(`Not enough ${retailerName} $${req.denomination} cards`);
        }
        const card = db.prepare(`
          SELECT id FROM inventory_cards
          WHERE retailer_name = ? AND denomination = ? AND status = 'reserved' AND reserved_for_txn = ?
          ORDER BY reserved_at DESC LIMIT 1
        `).get(retailerName, req.denomination, transactionId) as { id: string };
        reserved.push(card.id);
        logAction.run(randomUUID(), card.id, transactionId);
      }
    }
  });

  try {
    transaction();
    return { success: true, reserved };
  } catch (err) {
    if (reserved.length > 0) {
      db.prepare(`
        UPDATE inventory_cards SET status = 'available', reserved_at = NULL, reserved_for_txn = NULL
        WHERE reserved_for_txn = ?
      `).run(transactionId);
    }
    return { success: false, reserved: [], error: (err as Error).message };
  }
}

export function releaseCards(transactionId: string) {
  const db = getDb();
  const cards = db.prepare(`
    SELECT id, denomination, code_encrypted, pin_encrypted
    FROM inventory_cards
    WHERE reserved_for_txn = ? AND status = 'reserved'
  `).all(transactionId) as {
    id: string;
    denomination: number;
    code_encrypted: string;
    pin_encrypted: string | null;
  }[];

  const markSold = db.prepare(`
    UPDATE inventory_cards SET status = 'sold', sold_at = datetime('now') WHERE id = ?
  `);
  const logAction = db.prepare(`
    INSERT INTO inventory_audit_log (id, card_id, action, performed_by)
    VALUES (?, ?, 'sold', ?)
  `);

  const released = db.transaction(() => {
    return cards.map(card => {
      markSold.run(card.id);
      logAction.run(randomUUID(), card.id, transactionId);
      const code = decrypt(card.code_encrypted);
      return {
        denomination: card.denomination,
        code,
        pin: card.pin_encrypted ? decrypt(card.pin_encrypted) : null,
        code_last4: code.slice(-4),
      };
    });
  })();

  return released;
}

export function unreserveCards(transactionId: string) {
  const db = getDb();
  const logAction = db.prepare(`
    INSERT INTO inventory_audit_log (id, card_id, action, performed_by)
    VALUES (?, ?, 'released', ?)
  `);
  const cards = db.prepare(`
    SELECT id FROM inventory_cards WHERE reserved_for_txn = ? AND status = 'reserved'
  `).all(transactionId) as { id: string }[];

  db.transaction(() => {
    db.prepare(`
      UPDATE inventory_cards SET status = 'available', reserved_at = NULL, reserved_for_txn = NULL
      WHERE reserved_for_txn = ? AND status = 'reserved'
    `).run(transactionId);
    cards.forEach(card => logAction.run(randomUUID(), card.id, transactionId));
  })();
}

// HTTP Routes
router.get('/availability/:retailer', (req: Request, res: Response) => {
  const result = checkAvailability(req.params.retailer);
  res.json(result);
});

router.post('/reserve', (req: Request, res: Response) => {
  const { retailer_name, cards, transaction_id } = req.body;
  if (!retailer_name || !cards || !transaction_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const result = reserveCards(retailer_name, cards, transaction_id);
  if (!result.success) {
    return res.status(409).json(result);
  }
  res.json(result);
});

router.post('/release', (req: Request, res: Response) => {
  const { transaction_id } = req.body;
  if (!transaction_id) {
    return res.status(400).json({ error: 'Missing transaction_id' });
  }
  const codes = releaseCards(transaction_id);
  res.json({ codes });
});

router.post('/unreserve', (req: Request, res: Response) => {
  const { transaction_id } = req.body;
  if (!transaction_id) {
    return res.status(400).json({ error: 'Missing transaction_id' });
  }
  unreserveCards(transaction_id);
  res.json({ success: true });
});

export default router;
