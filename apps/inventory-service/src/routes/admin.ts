import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { encrypt } from '../encryption';
import { randomUUID } from 'node:crypto';

const router = Router();

// Add a single card
router.post('/cards', (req: Request, res: Response) => {
  const { retailer_name, denomination, code, pin, cost_paid, source } = req.body;
  if (!retailer_name || !denomination || !code || cost_paid === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDb();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO inventory_cards (id, retailer_name, denomination, code_encrypted, pin_encrypted, cost_paid, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, retailer_name, denomination, encrypt(code), pin ? encrypt(pin) : null, cost_paid, source || null);

  db.prepare(`
    INSERT INTO inventory_audit_log (id, card_id, action, performed_by)
    VALUES (?, ?, 'added', 'admin')
  `).run(randomUUID(), id);

  res.status(201).json({ id, retailer_name, denomination, status: 'available' });
});

// Bulk add cards
router.post('/cards/bulk', (req: Request, res: Response) => {
  const { cards } = req.body;
  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: 'cards must be a non-empty array' });
  }

  const db = getDb();
  const insertCard = db.prepare(`
    INSERT INTO inventory_cards (id, retailer_name, denomination, code_encrypted, pin_encrypted, cost_paid, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertLog = db.prepare(`
    INSERT INTO inventory_audit_log (id, card_id, action, performed_by)
    VALUES (?, ?, 'added', 'admin')
  `);

  const results = db.transaction(() => {
    return cards.map((card: any) => {
      const id = randomUUID();
      insertCard.run(
        id,
        card.retailer_name,
        card.denomination,
        encrypt(card.code),
        card.pin ? encrypt(card.pin) : null,
        card.cost_paid,
        card.source || null
      );
      insertLog.run(randomUUID(), id);
      return { id, retailer_name: card.retailer_name, denomination: card.denomination };
    });
  })();

  res.status(201).json({ added: results.length, cards: results });
});

// Get inventory summary
router.get('/summary', (_req: Request, res: Response) => {
  const db = getDb();
  const summary = db.prepare(`
    SELECT
      retailer_name,
      denomination,
      status,
      COUNT(*) as count,
      SUM(cost_paid) as total_cost
    FROM inventory_cards
    GROUP BY retailer_name, denomination, status
    ORDER BY retailer_name, denomination
  `).all();

  res.json(summary);
});

// Get audit log
router.get('/audit-log', (req: Request, res: Response) => {
  const db = getDb();
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const logs = db.prepare(`
    SELECT al.*, ic.retailer_name, ic.denomination
    FROM inventory_audit_log al
    JOIN inventory_cards ic ON al.card_id = ic.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(limit);

  res.json(logs);
});

export default router;
