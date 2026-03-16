import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = process.env.INVENTORY_DB_PATH || path.join(__dirname, '..', 'inventory.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_cards (
      id TEXT PRIMARY KEY,
      retailer_name TEXT NOT NULL,
      denomination REAL NOT NULL,
      code_encrypted TEXT NOT NULL,
      pin_encrypted TEXT,
      cost_paid REAL NOT NULL,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
      reserved_at TEXT,
      reserved_for_txn TEXT,
      sold_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_audit_log (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES inventory_cards(id),
      action TEXT NOT NULL CHECK (action IN ('added', 'reserved', 'released', 'sold', 'expired')),
      performed_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cards_status_retailer
      ON inventory_cards(status, retailer_name);

    CREATE INDEX IF NOT EXISTS idx_cards_reserved_at
      ON inventory_cards(reserved_at)
      WHERE status = 'reserved';
  `);
}
