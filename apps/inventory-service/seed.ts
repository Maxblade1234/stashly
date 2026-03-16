import { encrypt } from './src/encryption';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

// Demo seed script for inventory service
// Run: npx tsx seed.ts

const DB_PATH = process.env.INVENTORY_DB_PATH || path.join(__dirname, 'data', 'inventory.db');
const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY || 'a'.repeat(64);

// Seed data: retailer gift cards with realistic denominations
const seedCards = [
  // Apple
  { retailer: 'Apple', denomination: 25, discount: 5, count: 3 },
  { retailer: 'Apple', denomination: 50, discount: 6, count: 3 },
  { retailer: 'Apple', denomination: 100, discount: 7, count: 2 },
  // Chipotle
  { retailer: 'Chipotle', denomination: 10, discount: 8, count: 3 },
  { retailer: 'Chipotle', denomination: 25, discount: 10, count: 3 },
  // Dominos
  { retailer: 'Dominos', denomination: 10, discount: 12, count: 3 },
  { retailer: 'Dominos', denomination: 25, discount: 15, count: 2 },
  // eBay
  { retailer: 'eBay', denomination: 25, discount: 3, count: 2 },
  { retailer: 'eBay', denomination: 50, discount: 4, count: 2 },
  { retailer: 'eBay', denomination: 100, discount: 5, count: 2 },
  // NFL Shop
  { retailer: 'NFL Shop', denomination: 25, discount: 8, count: 2 },
  { retailer: 'NFL Shop', denomination: 50, discount: 10, count: 2 },
  // Fanatics
  { retailer: 'Fanatics', denomination: 25, discount: 7, count: 2 },
  { retailer: 'Fanatics', denomination: 50, discount: 9, count: 2 },
  // Jersey Mikes
  { retailer: 'Jersey Mikes', denomination: 10, discount: 10, count: 2 },
  { retailer: 'Jersey Mikes', denomination: 25, discount: 12, count: 2 },
  // New Era
  { retailer: 'New Era', denomination: 25, discount: 6, count: 2 },
  { retailer: 'New Era', denomination: 50, discount: 8, count: 2 },
  // Riot Games
  { retailer: 'Riot Games', denomination: 10, discount: 5, count: 2 },
  { retailer: 'Riot Games', denomination: 25, discount: 7, count: 3 },
  // Off Season
  { retailer: 'Off Season', denomination: 25, discount: 10, count: 2 },
  { retailer: 'Off Season', denomination: 50, discount: 12, count: 2 },
];

function generateDemoCode(): string {
  const segments = Array.from({ length: 4 }, () =>
    crypto.randomBytes(2).toString('hex').toUpperCase()
  );
  return `DEMO-${segments.join('-')}`;
}

async function seed() {
  console.log('Seeding inventory database...');
  console.log(`   DB: ${DB_PATH}`);

  // Ensure data directory exists
  const fs = await import('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create tables if not exist
  const createSQL = `
    CREATE TABLE IF NOT EXISTS inventory_cards (
      id TEXT PRIMARY KEY,
      retailer_name TEXT NOT NULL,
      denomination REAL NOT NULL,
      encrypted_code TEXT NOT NULL,
      discount_percent REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      transaction_id TEXT,
      reserved_at TEXT,
      sold_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      action TEXT NOT NULL,
      transaction_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `;
  // Note: using better-sqlite3's exec method (not child_process)
  db.exec(createSQL);

  // Clear existing demo cards
  db.exec("DELETE FROM inventory_cards WHERE status = 'available'");

  let totalCards = 0;

  const insert = db.prepare(`
    INSERT INTO inventory_cards (id, retailer_name, denomination, encrypted_code, discount_percent, status)
    VALUES (?, ?, ?, ?, ?, 'available')
  `);

  const insertMany = db.transaction(() => {
    for (const card of seedCards) {
      for (let i = 0; i < card.count; i++) {
        const id = crypto.randomUUID();
        const code = generateDemoCode();
        const encryptedCode = encrypt(code, ENCRYPTION_KEY);

        insert.run(id, card.retailer, card.denomination, encryptedCode, card.discount);
        totalCards++;
      }
    }
  });

  insertMany();

  const uniqueRetailers = new Set(seedCards.map(c => c.retailer)).size;
  console.log(`Seeded ${totalCards} demo gift cards across ${uniqueRetailers} retailers`);

  // Print summary
  const summary = db.prepare(`
    SELECT retailer_name, denomination, COUNT(*) as count, discount_percent
    FROM inventory_cards
    WHERE status = 'available'
    GROUP BY retailer_name, denomination
    ORDER BY retailer_name, denomination
  `).all();

  console.log('\nInventory Summary:');
  let currentRetailer = '';
  for (const row of summary as Array<{ retailer_name: string; denomination: number; count: number; discount_percent: number }>) {
    if (row.retailer_name !== currentRetailer) {
      currentRetailer = row.retailer_name;
      console.log(`\n  ${currentRetailer}:`);
    }
    console.log(`    $${row.denomination} x ${row.count} (${row.discount_percent}% off)`);
  }

  db.close();
  console.log('\nDone!');
}

seed().catch(console.error);
