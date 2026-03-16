import { getDb } from './db';
import { randomUUID } from 'node:crypto';

const RESERVATION_EXPIRY_MINUTES = 10;

export function expireStaleReservations() {
  const db = getDb();
  const staleCards = db.prepare(`
    SELECT id FROM inventory_cards
    WHERE status = 'reserved'
    AND reserved_at < datetime('now', '-' || ? || ' minutes')
  `).all(RESERVATION_EXPIRY_MINUTES) as { id: string }[];

  if (staleCards.length === 0) return 0;

  const logAction = db.prepare(`
    INSERT INTO inventory_audit_log (id, card_id, action, performed_by)
    VALUES (?, ?, 'expired', 'system')
  `);

  db.transaction(() => {
    db.prepare(`
      UPDATE inventory_cards
      SET status = 'available', reserved_at = NULL, reserved_for_txn = NULL
      WHERE status = 'reserved'
      AND reserved_at < datetime('now', '-' || ? || ' minutes')
    `).run(RESERVATION_EXPIRY_MINUTES);

    staleCards.forEach(card => logAction.run(randomUUID(), card.id));
  })();

  console.log(`Expired ${staleCards.length} stale reservations`);
  return staleCards.length;
}

export function startReservationExpiryJob() {
  setInterval(expireStaleReservations, 60 * 1000);
  console.log('Reservation expiry job started (runs every 60s)');
}
