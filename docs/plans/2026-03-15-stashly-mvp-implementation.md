# Stashly MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working Chrome extension + website MVP that sells discounted gift cards at checkout, with demo mode for pitching and live mode for real users.

**Architecture:** Monorepo with three packages — Next.js website+API, Node.js/Express inventory service, and Chrome extension (Manifest V3). Supabase for database + auth. Payment processor abstracted behind an interface (demo mode first, real processor later).

**Tech Stack:** TypeScript, Next.js 14 (App Router), Supabase, Node.js/Express, Manifest V3 Chrome Extension, Tailwind CSS, Vitest for testing.

**Design Doc:** `docs/plans/2026-03-15-stashly-architecture-design.md`

---

## Task Group 1: Project Scaffolding & Database

### Task 1: Initialize monorepo structure

**Files:**
- Create: `package.json` (root workspace)
- Create: `apps/web/` (Next.js app)
- Create: `apps/inventory-service/` (Express app)
- Create: `apps/extension/` (Chrome extension)
- Create: `packages/shared/` (shared types/constants)
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Initialize root package.json with npm workspaces**

```json
{
  "name": "stashly",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

**Step 2: Scaffold Next.js app**

Run: `cd apps && npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --no-import-alias`

**Step 3: Scaffold inventory service**

```bash
mkdir -p apps/inventory-service/src
cd apps/inventory-service
npm init -y
```

Create `apps/inventory-service/package.json`:
```json
{
  "name": "@stashly/inventory-service",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  }
}
```

**Step 4: Scaffold Chrome extension**

```bash
mkdir -p apps/extension/{content,popup,utils,styles}
```

Create `apps/extension/manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "Stashly",
  "version": "0.1.0",
  "description": "Save money at checkout with discounted gift cards",
  "permissions": ["activeTab", "storage", "cookies"],
  "host_permissions": ["https://*.stashly.com/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/detector.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

**Step 5: Scaffold shared types package**

Create `packages/shared/package.json`:
```json
{
  "name": "@stashly/shared",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

**Step 6: Create .gitignore**

```
node_modules/
.env
.env.local
dist/
.next/
.turbo/
*.log
```

**Step 7: Create .env.example**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Inventory Service
INVENTORY_SERVICE_URL=http://localhost:3001
INVENTORY_SERVICE_API_KEY=

# Encryption
CARD_ENCRYPTION_KEY=

# Mode
STASHLY_MODE=demo

# Payment Processor (TBD)
PAYMENT_PROCESSOR_API_KEY=
```

**Step 8: Install root dependencies**

Run: `npm install`

**Step 9: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: initialize stashly monorepo with web, inventory-service, extension, and shared packages"
```

---

### Task 2: Define shared types

**Files:**
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/constants.ts`

**Step 1: Write shared types**

Create `packages/shared/src/types.ts`:
```typescript
// Retailer types
export interface Retailer {
  id: string;
  name: string;
  domain: string;
  checkout_url_patterns: string[];
  cart_total_selectors: string[];
  gift_card_input_selector: string;
  gift_card_pin_selector: string | null;
  apply_button_selector: string;
  add_another_selector: string | null;
  max_gift_cards_per_order: number | null;
  available_denominations: number[];
  per_user_daily_limit_usd: number;
  stacking_notes: string | null;
  is_active: boolean;
  logo_url: string | null;
}

// Stacking algorithm types
export interface GiftCardOffer {
  denomination: number;
  quantity: number;
  price_per_card: number;
  total_price: number;
  discount_percent: number;
}

export interface StackRecommendation {
  retailer_name: string;
  cart_total: number;
  cards: GiftCardOffer[];
  total_paid: number;
  total_gift_card_value: number;
  savings: number;
  savings_percent: number;
  residual_balance: number;
  remaining_to_pay: number;
  capped: boolean;
  cap_reason: string | null;
}

// Transaction types
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  user_id: string;
  retailer_id: string;
  cards_purchased: CardPurchased[];
  total_paid: number;
  total_value: number;
  savings: number;
  residual_balance: number;
  status: TransactionStatus;
  payment_processor_id: string | null;
  demo: boolean;
  created_at: string;
}

export interface CardPurchased {
  denomination: number;
  cost: number;
  code_last4: string;
}

// Stashly balance types
export interface StashlyBalance {
  id: string;
  user_id: string;
  retailer_id: string;
  retailer_name: string;
  balance: number;
}

// Inventory service types (internal, not exposed to clients)
export type CardStatus = 'available' | 'reserved' | 'sold';

export interface InventoryAvailability {
  retailer_name: string;
  denomination: number;
  available: boolean;
  discount_percent: number;
  price: number;
}

// API request/response types
export interface StackRequest {
  retailer_id: string;
  cart_total: number;
}

export interface PurchaseRequest {
  retailer_id: string;
  cart_total: number;
  payment_token?: string;
}

export interface PurchaseResponse {
  transaction_id: string;
  codes: DeliveredCode[];
  residual_balance: number;
  total_paid: number;
  total_savings: number;
}

export interface DeliveredCode {
  denomination: number;
  code: string;
  pin: string | null;
}

// User types
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  savings_total: number;
  role: UserRole;
  created_at: string;
}
```

**Step 2: Write constants**

Create `packages/shared/src/constants.ts`:
```typescript
export const RESERVATION_EXPIRY_MINUTES = 10;
export const MAX_INVENTORY_CHECKS_PER_HOUR = 10;
export const MAX_PURCHASES_PER_HOUR = 3;
export const DEFAULT_DAILY_LIMIT_USD = 200;
export const RETAILER_CONFIG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const FIRST_PURCHASE_HOLD_HOURS = 24;

export const DEMO_CODE_PREFIX = 'DEMO';

export const STASHLY_MODE = {
  DEMO: 'demo',
  LIVE: 'live',
} as const;
```

**Step 3: Create barrel export**

Create `packages/shared/src/index.ts`:
```typescript
export * from './types';
export * from './constants';
```

**Step 4: Commit**

```bash
git add packages/shared/
git commit -m "feat: add shared types and constants for Stashly platform"
```

---

### Task 3: Set up Supabase schema

**Files:**
- Create: `apps/web/supabase/migrations/001_initial_schema.sql`
- Create: `apps/web/src/lib/supabase/client.ts`
- Create: `apps/web/src/lib/supabase/server.ts`

**Step 1: Write the migration SQL**

Create `apps/web/supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  phone text,
  savings_total numeric(10, 2) default 0,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Retailers
create table public.retailers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text not null unique,
  checkout_url_patterns text[] not null default '{}',
  cart_total_selectors text[] not null default '{}',
  gift_card_input_selector text,
  gift_card_pin_selector text,
  apply_button_selector text,
  add_another_selector text,
  max_gift_cards_per_order int,
  available_denominations int[] not null default '{}',
  per_user_daily_limit_usd numeric(10, 2) not null default 200,
  stacking_notes text,
  is_active boolean not null default false,
  logo_url text,
  updated_at timestamptz default now()
);

-- Transactions
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  retailer_id uuid not null references public.retailers(id),
  cards_purchased jsonb not null default '[]',
  total_paid numeric(10, 2) not null,
  total_value numeric(10, 2) not null,
  savings numeric(10, 2) not null,
  residual_balance numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_processor_id text,
  demo boolean not null default false,
  created_at timestamptz default now()
);

-- Stashly balances
create table public.stashly_balances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  retailer_id uuid not null references public.retailers(id),
  balance numeric(10, 2) not null default 0,
  updated_at timestamptz default now(),
  unique (user_id, retailer_id)
);

-- Payment methods
create table public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  processor_token text not null,
  last_four text not null,
  brand text not null,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.retailers enable row level security;
alter table public.transactions enable row level security;
alter table public.stashly_balances enable row level security;
alter table public.payment_methods enable row level security;

-- Profiles: users can read/update own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Retailers: all authenticated users can read active retailers
create policy "Anyone can view active retailers"
  on public.retailers for select
  using (is_active = true);

create policy "Admins can manage retailers"
  on public.retailers for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Transactions: users can read own transactions
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Stashly balances: users can read own balances
create policy "Users can view own balances"
  on public.stashly_balances for select
  using (auth.uid() = user_id);

-- Payment methods: users can manage own payment methods
create policy "Users can manage own payment methods"
  on public.payment_methods for all
  using (auth.uid() = user_id);

-- Indexes
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_created_at on public.transactions(created_at desc);
create index idx_stashly_balances_user_retailer on public.stashly_balances(user_id, retailer_id);
create index idx_retailers_domain on public.retailers(domain);

-- Function: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed data: MVP retailers
insert into public.retailers (name, domain, checkout_url_patterns, available_denominations, per_user_daily_limit_usd, is_active) values
  ('Apple', 'apple.com', '{"/shop/checkout","/store/checkout"}', '{25,50,100}', 500, true),
  ('Chipotle', 'chipotle.com', '{"/order/checkout","/checkout"}', '{10,25,50}', 200, true),
  ('Dominos', 'dominos.com', '{"/pages/order/checkout"}', '{10,20,25,50}', 200, true),
  ('Riot Games', 'riotgames.com', '{"/en/checkout","/checkout"}', '{10,25,50}', 200, true),
  ('eBay', 'ebay.com', '{"/pay/"}', '{25,50,100}', 500, true),
  ('New Era', 'neweracap.com', '{"/checkout"}', '{25,50}', 200, true),
  ('NFL Shop', 'nflshop.com', '{"/checkout"}', '{25,50,100}', 300, true),
  ('Jersey Mikes', 'jerseymikes.com', '{"/checkout"}', '{10,25,50,100}', 200, true),
  ('Off Season', 'offseason.com', '{"/checkout"}', '{25,50,100}', 500, true),
  ('Fanatics', 'fanatics.com', '{"/checkout"}', '{25,50}', 200, true);
```

**Step 2: Set up Supabase client for browser**

Create `apps/web/src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 3: Set up Supabase client for server**

Create `apps/web/src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  );
}
```

**Step 4: Install Supabase dependencies**

Run: `cd apps/web && npm install @supabase/supabase-js @supabase/ssr`

**Step 5: Commit**

```bash
git add apps/web/supabase/ apps/web/src/lib/supabase/
git commit -m "feat: add Supabase schema migration with RLS policies and seed retailers"
```

---

## Task Group 2: Inventory Service

### Task 4: Inventory service core setup

**Files:**
- Create: `apps/inventory-service/src/index.ts`
- Create: `apps/inventory-service/src/db.ts`
- Create: `apps/inventory-service/src/middleware/auth.ts`
- Create: `apps/inventory-service/src/encryption.ts`
- Create: `apps/inventory-service/tsconfig.json`

**Step 1: Install dependencies**

```bash
cd apps/inventory-service
npm install express cors helmet better-sqlite3 dotenv
npm install -D typescript tsx @types/express @types/cors @types/better-sqlite3 vitest
```

Note: Using SQLite (better-sqlite3) for MVP. Simple, no external DB server needed, works well for single-service access pattern. Can migrate to Postgres later.

**Step 2: Write tsconfig.json**

Create `apps/inventory-service/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Step 3: Write encryption utility**

Create `apps/inventory-service/src/encryption.ts`:
```typescript
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.CARD_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('CARD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

**Step 4: Write database setup**

Create `apps/inventory-service/src/db.ts`:
```typescript
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
```

**Step 5: Write auth middleware**

Create `apps/inventory-service/src/middleware/auth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export function requireServiceKey(req: Request, res: Response, next: NextFunction) {
  // Skip auth for health check
  if (req.path === '/health') return next();

  const apiKey = req.headers['x-service-key'];
  const expectedKey = process.env.INVENTORY_SERVICE_API_KEY;

  if (!expectedKey) {
    console.error('INVENTORY_SERVICE_API_KEY not configured');
    return res.status(500).json({ error: 'Service misconfigured' });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
```

**Step 6: Write Express server entry point**

Create `apps/inventory-service/src/index.ts`:
```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireServiceKey } from './middleware/auth';
import { getDb } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use(requireServiceKey);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes will be added in Task 5

// Initialize DB on startup
getDb();

app.listen(PORT, () => {
  console.log(`Inventory service running on port ${PORT}`);
});

export default app;
```

**Step 7: Commit**

```bash
git add apps/inventory-service/
git commit -m "feat: scaffold inventory service with encryption, SQLite, and auth middleware"
```

---

### Task 5: Inventory service routes

**Files:**
- Create: `apps/inventory-service/src/routes/cards.ts`
- Create: `apps/inventory-service/src/routes/admin.ts`
- Create: `apps/inventory-service/src/reservation.ts`
- Create: `apps/inventory-service/src/__tests__/cards.test.ts`
- Modify: `apps/inventory-service/src/index.ts`

**Step 1: Write the failing tests**

Create `apps/inventory-service/src/__tests__/cards.test.ts`:
```typescript
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
    db.exec('DELETE FROM inventory_audit_log');
    db.exec('DELETE FROM inventory_cards');
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
    db.exec('DELETE FROM inventory_audit_log');
    db.exec('DELETE FROM inventory_cards');
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
    db.exec('DELETE FROM inventory_audit_log');
    db.exec('DELETE FROM inventory_cards');
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
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/inventory-service && npx vitest run`
Expected: FAIL — modules don't exist yet

**Step 3: Write cards route with business logic**

Create `apps/inventory-service/src/routes/cards.ts`:
```typescript
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
```

**Step 4: Write admin routes**

Create `apps/inventory-service/src/routes/admin.ts`:
```typescript
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
```

**Step 5: Write reservation expiry job**

Create `apps/inventory-service/src/reservation.ts`:
```typescript
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
```

**Step 6: Wire routes into index.ts**

Update `apps/inventory-service/src/index.ts`:
```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireServiceKey } from './middleware/auth';
import { getDb } from './db';
import cardsRouter from './routes/cards';
import adminRouter from './routes/admin';
import { startReservationExpiryJob } from './reservation';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use(requireServiceKey);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/cards', cardsRouter);
app.use('/admin', adminRouter);

getDb();
startReservationExpiryJob();

app.listen(PORT, () => {
  console.log(`Inventory service running on port ${PORT}`);
});

export default app;
```

**Step 7: Run tests**

Run: `cd apps/inventory-service && npx vitest run`
Expected: All tests PASS

**Step 8: Commit**

```bash
git add apps/inventory-service/
git commit -m "feat: implement inventory service with reserve/release/expire flow and admin routes"
```

---

## Task Group 3: Stashly API (Next.js API Routes)

### Task 6: Stacking algorithm

**Files:**
- Create: `apps/web/src/lib/stacking.ts`
- Create: `apps/web/src/lib/__tests__/stacking.test.ts`

**Step 1: Write failing tests**

Create `apps/web/src/lib/__tests__/stacking.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateOptimalStack } from '../stacking';

const availability = [
  { retailer_name: 'Apple', denomination: 25, available: true, discount_percent: 10, price: 22.50 },
  { retailer_name: 'Apple', denomination: 50, available: true, discount_percent: 11, price: 44.50 },
  { retailer_name: 'Apple', denomination: 100, available: true, discount_percent: 10.5, price: 89.50 },
];

describe('calculateOptimalStack', () => {
  it('covers a simple cart total with one card', () => {
    const result = calculateOptimalStack(45, availability, { maxCards: 10, dailyLimitUsd: 500, spentTodayUsd: 0 });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].denomination).toBe(50);
    expect(result.total_gift_card_value).toBe(50);
    expect(result.residual_balance).toBe(5);
  });

  it('stacks multiple cards for large cart', () => {
    const result = calculateOptimalStack(280, availability, { maxCards: 10, dailyLimitUsd: 500, spentTodayUsd: 0 });
    expect(result.total_gift_card_value).toBeGreaterThanOrEqual(280);
    expect(result.savings).toBeGreaterThan(0);
  });

  it('respects max card limit', () => {
    const result = calculateOptimalStack(1000, availability, { maxCards: 3, dailyLimitUsd: 5000, spentTodayUsd: 0 });
    const totalCards = result.cards.reduce((sum, c) => sum + c.quantity, 0);
    expect(totalCards).toBeLessThanOrEqual(3);
    expect(result.capped).toBe(true);
  });

  it('respects daily spending limit', () => {
    const result = calculateOptimalStack(1000, availability, { maxCards: 100, dailyLimitUsd: 200, spentTodayUsd: 0 });
    expect(result.total_paid).toBeLessThanOrEqual(200);
    expect(result.capped).toBe(true);
  });

  it('accounts for already spent today', () => {
    const result = calculateOptimalStack(1000, availability, { maxCards: 100, dailyLimitUsd: 200, spentTodayUsd: 150 });
    expect(result.total_paid).toBeLessThanOrEqual(50);
    expect(result.capped).toBe(true);
  });

  it('returns empty stack when nothing available', () => {
    const result = calculateOptimalStack(100, [], { maxCards: 10, dailyLimitUsd: 500, spentTodayUsd: 0 });
    expect(result.cards).toHaveLength(0);
    expect(result.savings).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/lib/__tests__/stacking.test.ts`
Expected: FAIL

**Step 3: Implement stacking algorithm**

Create `apps/web/src/lib/stacking.ts`:
```typescript
import type { InventoryAvailability, StackRecommendation, GiftCardOffer } from '@stashly/shared';

interface StackConstraints {
  maxCards: number | null;
  dailyLimitUsd: number;
  spentTodayUsd: number;
}

export function calculateOptimalStack(
  cartTotal: number,
  availability: InventoryAvailability[],
  constraints: StackConstraints
): StackRecommendation {
  if (availability.length === 0) {
    return emptyStack(cartTotal, '');
  }

  const retailerName = availability[0].retailer_name;
  const maxCards = constraints.maxCards ?? Infinity;
  const remainingBudget = constraints.dailyLimitUsd - constraints.spentTodayUsd;

  const sorted = [...availability]
    .filter(a => a.available && a.price <= remainingBudget)
    .sort((a, b) => b.denomination - a.denomination);

  const cards: GiftCardOffer[] = [];
  let totalPaid = 0;
  let totalValue = 0;
  let cardCount = 0;
  let amountToCover = cartTotal;
  let budgetLeft = remainingBudget;
  let capped = false;
  let capReason: string | null = null;

  for (const denom of sorted) {
    if (amountToCover <= 0 || cardCount >= maxCards || budgetLeft < denom.price) continue;

    const neededByAmount = Math.ceil(amountToCover / denom.denomination);
    const allowedByCardLimit = maxCards - cardCount;
    const allowedByBudget = Math.floor(budgetLeft / denom.price);
    const quantity = Math.min(neededByAmount, allowedByCardLimit, allowedByBudget);

    if (quantity > 0) {
      cards.push({
        denomination: denom.denomination,
        quantity,
        price_per_card: denom.price,
        total_price: Math.round(denom.price * quantity * 100) / 100,
        discount_percent: denom.discount_percent,
      });
      totalPaid += denom.price * quantity;
      totalValue += denom.denomination * quantity;
      cardCount += quantity;
      amountToCover -= denom.denomination * quantity;
      budgetLeft -= denom.price * quantity;
    }
  }

  if (amountToCover > 0 && (cardCount >= maxCards || budgetLeft <= 0)) {
    capped = true;
    capReason = cardCount >= maxCards
      ? `Maximum ${maxCards} gift cards per order`
      : `Daily purchase limit of $${constraints.dailyLimitUsd} reached`;
  }

  totalPaid = Math.round(totalPaid * 100) / 100;
  totalValue = Math.round(totalValue * 100) / 100;
  const savings = Math.round((totalValue - totalPaid) * 100) / 100;
  const residualBalance = Math.round(Math.max(0, totalValue - cartTotal) * 100) / 100;
  const remainingToPay = Math.round(Math.max(0, cartTotal - totalValue) * 100) / 100;

  return {
    retailer_name: retailerName,
    cart_total: cartTotal,
    cards,
    total_paid: totalPaid,
    total_gift_card_value: totalValue,
    savings,
    savings_percent: totalValue > 0 ? Math.round((savings / totalValue) * 1000) / 10 : 0,
    residual_balance: residualBalance,
    remaining_to_pay: remainingToPay,
    capped,
    cap_reason: capReason,
  };
}

function emptyStack(cartTotal: number, retailerName: string): StackRecommendation {
  return {
    retailer_name: retailerName,
    cart_total: cartTotal,
    cards: [],
    total_paid: 0,
    total_gift_card_value: 0,
    savings: 0,
    savings_percent: 0,
    residual_balance: 0,
    remaining_to_pay: cartTotal,
    capped: false,
    cap_reason: null,
  };
}
```

**Step 4: Run tests**

Run: `cd apps/web && npx vitest run src/lib/__tests__/stacking.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add apps/web/src/lib/stacking.ts apps/web/src/lib/__tests__/
git commit -m "feat: implement server-side gift card stacking algorithm with cap enforcement"
```

---

### Task 7: API routes — retailers, stacking, purchase, balances

**Files:**
- Create: `apps/web/src/app/api/retailers/route.ts`
- Create: `apps/web/src/app/api/stack/route.ts`
- Create: `apps/web/src/app/api/purchase/route.ts`
- Create: `apps/web/src/app/api/balances/route.ts`
- Create: `apps/web/src/lib/inventory-client.ts`
- Create: `apps/web/src/lib/rate-limit.ts`

**Step 1: Write inventory service client**

Create `apps/web/src/lib/inventory-client.ts`:
```typescript
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
const SERVICE_KEY = process.env.INVENTORY_SERVICE_API_KEY || '';

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
```

**Step 2: Write rate limiter**

Create `apps/web/src/lib/rate-limit.ts`:
```typescript
const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}
```

**Step 3: Write retailers API route**

Create `apps/web/src/app/api/retailers/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('retailers')
    .select('id, name, domain, checkout_url_patterns, cart_total_selectors, gift_card_input_selector, gift_card_pin_selector, apply_button_selector, add_another_selector, max_gift_cards_per_order, available_denominations, per_user_daily_limit_usd, stacking_notes, logo_url')
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

**Step 4: Write stack API route**

Create `apps/web/src/app/api/stack/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailability } from '@/lib/inventory-client';
import { calculateOptimalStack } from '@/lib/stacking';
import { rateLimit } from '@/lib/rate-limit';

const MAX_CHECKS_PER_HOUR = 10;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(`stack:${user.id}`, MAX_CHECKS_PER_HOUR, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { retailer_id, cart_total } = await req.json();
  if (!retailer_id || !cart_total || cart_total <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { data: retailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('id', retailer_id)
    .eq('is_active', true)
    .single();

  if (!retailer) {
    return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: todayTransactions } = await supabase
    .from('transactions')
    .select('total_paid')
    .eq('user_id', user.id)
    .eq('retailer_id', retailer_id)
    .eq('status', 'completed')
    .gte('created_at', `${today}T00:00:00Z`);

  const spentToday = (todayTransactions || []).reduce((sum: number, t: any) => sum + t.total_paid, 0);

  const availability = await getAvailability(retailer.name);

  const stack = calculateOptimalStack(cart_total, availability, {
    maxCards: retailer.max_gift_cards_per_order,
    dailyLimitUsd: retailer.per_user_daily_limit_usd,
    spentTodayUsd: spentToday,
  });

  return NextResponse.json(stack);
}
```

**Step 5: Write purchase API route**

Create `apps/web/src/app/api/purchase/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailability, reserveCards, releaseCards, unreserveCards } from '@/lib/inventory-client';
import { calculateOptimalStack } from '@/lib/stacking';
import { rateLimit } from '@/lib/rate-limit';
import { randomUUID } from 'node:crypto';

const MAX_PURCHASES_PER_HOUR = 3;
const isDemoMode = process.env.STASHLY_MODE === 'demo';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(`purchase:${user.id}`, MAX_PURCHASES_PER_HOUR, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { retailer_id, cart_total } = await req.json();
  if (!retailer_id || !cart_total || cart_total <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { data: retailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('id', retailer_id)
    .eq('is_active', true)
    .single();

  if (!retailer) {
    return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
  }

  // Recalculate stack server-side
  const today = new Date().toISOString().split('T')[0];
  const { data: todayTxns } = await supabase
    .from('transactions')
    .select('total_paid')
    .eq('user_id', user.id)
    .eq('retailer_id', retailer_id)
    .eq('status', 'completed')
    .gte('created_at', `${today}T00:00:00Z`);

  const spentToday = (todayTxns || []).reduce((sum: number, t: any) => sum + t.total_paid, 0);
  const availability = await getAvailability(retailer.name);
  const stack = calculateOptimalStack(cart_total, availability, {
    maxCards: retailer.max_gift_cards_per_order,
    dailyLimitUsd: retailer.per_user_daily_limit_usd,
    spentTodayUsd: spentToday,
  });

  if (stack.cards.length === 0) {
    return NextResponse.json({ error: 'No gift cards available' }, { status: 409 });
  }

  const transactionId = randomUUID();

  const cardsToReserve = stack.cards.map(c => ({
    denomination: c.denomination,
    quantity: c.quantity,
  }));

  const reservation = await reserveCards(retailer.name, cardsToReserve, transactionId);
  if (!reservation.success) {
    return NextResponse.json({ error: 'Cards no longer available' }, { status: 409 });
  }

  await supabase.from('transactions').insert({
    id: transactionId,
    user_id: user.id,
    retailer_id,
    cards_purchased: [],
    total_paid: stack.total_paid,
    total_value: stack.total_gift_card_value,
    savings: stack.savings,
    residual_balance: stack.residual_balance,
    status: 'pending',
    demo: isDemoMode,
  });

  if (isDemoMode) {
    const demoCodes = stack.cards.flatMap(card =>
      Array.from({ length: card.quantity }, () => {
        const seg = () => randomUUID().slice(0, 4).toUpperCase();
        return {
          denomination: card.denomination,
          code: `DEMO-${seg()}-${seg()}-${seg()}`,
          pin: null,
          code_last4: seg(),
        };
      })
    );

    await supabase.from('transactions').update({
      status: 'completed',
      cards_purchased: demoCodes.map(c => ({
        denomination: c.denomination,
        cost: stack.cards.find(sc => sc.denomination === c.denomination)!.price_per_card,
        code_last4: c.code_last4,
      })),
    }).eq('id', transactionId);

    // Update Stashly balance
    if (stack.residual_balance > 0) {
      const { data: existing } = await supabase
        .from('stashly_balances')
        .select('id, balance')
        .eq('user_id', user.id)
        .eq('retailer_id', retailer_id)
        .single();

      if (existing) {
        await supabase.from('stashly_balances')
          .update({ balance: existing.balance + stack.residual_balance, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('stashly_balances').insert({
          user_id: user.id,
          retailer_id: retailer_id,
          balance: stack.residual_balance,
        });
      }
    }

    return NextResponse.json({
      transaction_id: transactionId,
      codes: demoCodes,
      residual_balance: stack.residual_balance,
      total_paid: stack.total_paid,
      total_savings: stack.savings,
    });
  }

  // Live mode: return transaction ID for payment page
  return NextResponse.json({
    transaction_id: transactionId,
    total_paid: stack.total_paid,
    total_savings: stack.savings,
    payment_required: true,
  });
}
```

**Step 6: Write balances API route**

Create `apps/web/src/app/api/balances/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('stashly_balances')
    .select('id, retailer_id, balance, retailers(name, logo_url)')
    .eq('user_id', user.id)
    .gt('balance', 0);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const balances = (data || []).map((b: any) => ({
    id: b.id,
    retailer_id: b.retailer_id,
    retailer_name: b.retailers?.name,
    balance: b.balance,
  }));

  return NextResponse.json(balances);
}
```

**Step 7: Commit**

```bash
git add apps/web/src/app/api/ apps/web/src/lib/
git commit -m "feat: add API routes for retailers, stacking, purchase flow, and balances"
```

---

## Task Group 4: Website UI

### Task 8: Layout, landing page, and auth pages

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/app/signup/page.tsx`
- Create: `apps/web/src/components/Navbar.tsx`
- Create: `apps/web/src/app/auth/callback/route.ts`

**Step 1: Install UI dependencies**

Run: `cd apps/web && npm install lucide-react`

**Step 2: Create Navbar component**

Clean top nav with Stashly wordmark, navigation links (Dashboard, Gift Cards, History), and login/signup or user menu.

**Step 3: Update root layout**

Add Navbar, set metadata (title: "Stashly - Save More at Checkout"), import global styles.

**Step 4: Build landing page**

Hero section: "Save up to 15% at checkout with discounted gift cards." How-it-works steps: Install, Shop, Save. Supported retailers grid. CTA to install extension.

**Step 5: Build login page**

Email + password form using Supabase `signInWithPassword`. Redirect to `/dashboard` on success.

**Step 6: Build signup page**

Email + password + phone form using Supabase `signUp`. Show email verification prompt after submission.

**Step 7: Auth callback handler**

`/auth/callback` route — handles Supabase email verification redirect, exchanges code for session, redirects to `/dashboard`.

**Step 8: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add landing page, auth pages, and navigation layout"
```

---

### Task 9: Dashboard page

**Files:**
- Create: `apps/web/src/app/dashboard/page.tsx`
- Create: `apps/web/src/app/dashboard/layout.tsx`
- Create: `apps/web/src/components/SavingsSummary.tsx`
- Create: `apps/web/src/components/BalanceList.tsx`
- Create: `apps/web/src/components/RecentTransactions.tsx`

**Step 1: Dashboard layout** — server component, check auth, redirect to `/login` if unauthenticated.

**Step 2: SavingsSummary** — total saved all-time, saved this month, transaction count.

**Step 3: BalanceList** — Stashly balances by retailer with logo and amount.

**Step 4: RecentTransactions** — last 5 transactions with date, retailer, amount, savings, status.

**Step 5: Dashboard page** — compose components into grid layout.

**Step 6: Commit**

```bash
git add apps/web/src/app/dashboard/ apps/web/src/components/
git commit -m "feat: add user dashboard with savings summary, balances, and recent transactions"
```

---

### Task 10: Gift card browsing and purchase flow

**Files:**
- Create: `apps/web/src/app/gift-cards/page.tsx`
- Create: `apps/web/src/app/gift-cards/buy/page.tsx`
- Create: `apps/web/src/components/RetailerCard.tsx`
- Create: `apps/web/src/components/StackBreakdown.tsx`
- Create: `apps/web/src/components/PurchaseConfirmation.tsx`

**Step 1: RetailerCard** — retailer logo, name, discount range. Links to buy page.

**Step 2: Gift cards browse page** — grid of RetailerCards from `/api/retailers`.

**Step 3: StackBreakdown** — shows recommended stack with denominations, quantities, prices, totals, savings, and residual balance.

**Step 4: Purchase page** — `/gift-cards/buy?retailer={id}&amount={cartTotal}`. Fetches stack, shows breakdown, "Complete Purchase" button. Calls `/api/purchase` on click.

**Step 5: PurchaseConfirmation** — shows delivered codes with copy buttons, savings, Stashly balance added. Sends codes to extension via `window.postMessage`.

**Step 6: Commit**

```bash
git add apps/web/src/app/gift-cards/ apps/web/src/components/
git commit -m "feat: add gift card browsing, purchase flow, and code delivery pages"
```

---

### Task 11: History and settings pages

**Files:**
- Create: `apps/web/src/app/history/page.tsx`
- Create: `apps/web/src/app/settings/page.tsx`
- Create: `apps/web/src/app/api/transactions/route.ts`

**Step 1: Transactions API** — paginated history with retailer name join.

**Step 2: History page** — table with date, retailer, cards, amount paid, savings, status. Pagination and retailer filter.

**Step 3: Settings page** — account info, auto-apply toggle per retailer, danger zone (delete account, export data).

**Step 4: Commit**

```bash
git add apps/web/src/app/history/ apps/web/src/app/settings/ apps/web/src/app/api/transactions/
git commit -m "feat: add transaction history and user settings pages"
```

---

### Task 12: Admin panel

**Files:**
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/app/admin/inventory/page.tsx`
- Create: `apps/web/src/app/admin/retailers/page.tsx`
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/api/admin/inventory/route.ts`
- Create: `apps/web/src/app/api/admin/retailers/route.ts`

**Step 1: Admin layout** — role check (admin only), admin sidebar nav.

**Step 2: Admin inventory API** — proxies to inventory service. GET summary, POST add cards.

**Step 3: Admin retailers API** — CRUD for retailer configs.

**Step 4: Inventory page** — stock table, "Add Cards" form (single + CSV), audit log.

**Step 5: Retailer config page** — list with edit forms for selectors/limits, add new retailer.

**Step 6: Admin overview** — summary cards: revenue, cards sold, active inventory.

**Step 7: Commit**

```bash
git add apps/web/src/app/admin/ apps/web/src/app/api/admin/
git commit -m "feat: add admin panel with inventory management, retailer config, and sales overview"
```

---

## Task Group 5: Chrome Extension

### Task 13: Extension foundation — background worker and API client

**Files:**
- Create: `apps/extension/background.js`
- Create: `apps/extension/utils/api.js`
- Create: `apps/extension/utils/retailers.js`
- Create: `apps/extension/utils/config.js`

**Step 1: Config** — API base URL, website URL, cache TTL constants.

**Step 2: API client** — fetch wrapper that reads auth token from cookies. Methods: `getRetailers()`, `getStack()`, `getBalances()`, `reportSelectorFailure()`.

**Step 3: Retailer config manager** — fetch configs from API, cache in `chrome.storage.local` with TTL. Methods: `getRetailerForDomain()`, `refreshConfigs()`.

**Step 4: Background service worker** — message handler for content script requests: `CHECK_RETAILER`, `GET_STACK`, `GET_BALANCES`, `CHECK_AUTH`, `OPEN_PURCHASE`.

**Step 5: Commit**

```bash
git add apps/extension/
git commit -m "feat: add extension background worker, API client, and retailer config cache"
```

---

### Task 14: Content scripts — detection, overlay, auto-apply

**Files:**
- Create: `apps/extension/content/detector.js`
- Create: `apps/extension/content/overlay.js`
- Create: `apps/extension/content/auto-apply.js`
- Create: `apps/extension/styles/overlay.css`

**Step 1: Retailer detector** — on page load, check domain against cached retailers. If checkout URL matches, read cart total via selectors. Request stack from background. Inject overlay. Check Stashly balances.

**Step 2: Overlay UI** — shadow DOM container for style isolation. Shows savings amount, percentage, stack summary, "Save $X" CTA, dismiss button. Shows existing Stashly balance with "Apply" option. CTA opens purchase page.

**Step 3: Overlay CSS** — white card, subtle shadow, bottom-right position, slide-in animation. Scoped to shadow DOM.

**Step 4: Auto-apply** — listens for `STASHLY_CODES_READY` postMessage. For each code: find gift card input, fill code, click apply, wait for confirmation, click "add another" if needed, repeat. Falls back to floating panel with copy buttons on failure.

**Step 5: Commit**

```bash
git add apps/extension/content/ apps/extension/styles/
git commit -m "feat: add extension content scripts for retailer detection, savings overlay, and auto-apply"
```

---

### Task 15: Extension popup

**Files:**
- Create: `apps/extension/popup/popup.html`
- Create: `apps/extension/popup/popup.js`
- Create: `apps/extension/popup/popup.css`

**Step 1: Popup HTML** — Stashly logo, auth-dependent content area, footer.

**Step 2: Popup JS** — check auth on open. If logged in: show email, total savings, Stashly balances, dashboard link. If not: show login prompt.

**Step 3: Popup CSS** — 360px wide, max 500px tall. Matches website design language.

**Step 4: Commit**

```bash
git add apps/extension/popup/
git commit -m "feat: add extension popup with auth status, balances, and dashboard link"
```

---

## Task Group 6: Integration & Demo Mode

### Task 16: Website-to-extension communication bridge

**Files:**
- Create: `apps/web/src/lib/extension-bridge.ts`
- Modify: `apps/web/src/components/PurchaseConfirmation.tsx`

**Step 1: Extension bridge** — `sendCodesToExtension()` function that posts codes via `window.postMessage` with `STASHLY_CODES_READY` type.

**Step 2: Update PurchaseConfirmation** — call bridge after displaying codes.

**Step 3: Commit**

```bash
git add apps/web/src/lib/extension-bridge.ts apps/web/src/components/PurchaseConfirmation.tsx
git commit -m "feat: wire website-to-extension code delivery via postMessage bridge"
```

---

### Task 17: Demo mode seed data and end-to-end testing

**Files:**
- Create: `apps/inventory-service/seed.ts`
- Create: `apps/web/supabase/seed.sql`
- Create: `apps/web/src/app/api/admin/seed-demo/route.ts`

**Step 1: Inventory seed script** — adds ~30 demo gift cards across 10 retailers with realistic denominations and pricing. Uses encryption module for demo codes.

**Step 2: Supabase seed data** — demo user profile with pre-populated savings, Stashly balances, and sample transactions. Demo user set as admin.

**Step 3: Seed API endpoint** — POST `/api/admin/seed-demo` (admin only) to reset demo state.

**Step 4: End-to-end test**

1. Start inventory service: `cd apps/inventory-service && npm run dev`
2. Start website: `cd apps/web && npm run dev`
3. Load extension in Chrome: `chrome://extensions` → Load unpacked → `apps/extension`
4. Navigate to supported retailer checkout
5. Verify overlay appears with savings
6. Click through purchase flow
7. Verify demo codes delivered
8. Verify auto-apply attempts

**Step 5: Commit**

```bash
git add apps/inventory-service/seed.ts apps/web/supabase/seed.sql apps/web/src/app/api/admin/seed-demo/
git commit -m "feat: add demo seed data and verify end-to-end demo flow"
```

---

## Task Group 7: Security Hardening & Polish

### Task 18: Rate limiting, validation, and abuse prevention

**Files:**
- Modify: `apps/web/src/lib/rate-limit.ts`
- Create: `apps/web/src/middleware.ts`
- Modify: API routes — add zod validation

**Step 1: Install zod** — `cd apps/web && npm install zod`

**Step 2: Add zod schemas** for all API request bodies.

**Step 3: Next.js middleware** — global rate limiting by IP on `/api/*` routes. Auth check for protected routes.

**Step 4: First-purchase hold** — in purchase route, check if first transaction. If live mode, set `pending_review` status with 24-hour hold before code delivery.

**Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add rate limiting, input validation, and first-purchase hold for abuse prevention"
```

---

### Task 19: Extension build pipeline

**Files:**
- Create: `apps/extension/build.js`
- Create: `apps/extension/package.json`

**Step 1: Build script** — copies files to `dist/`, minifies JS with terser, minifies CSS, injects production API URLs, generates zip for Chrome Web Store.

**Step 2: npm scripts** — `build:dev` and `build:prod` with environment-specific config.

**Step 3: Test build** — `npm run build:dev`, verify `dist/` output.

**Step 4: Commit**

```bash
git add apps/extension/
git commit -m "feat: add extension build pipeline with minification and environment config"
```

---

### Task 20: Legal pages and deployment prep

**Files:**
- Create: `apps/web/src/app/privacy/page.tsx`
- Create: `apps/web/src/app/terms/page.tsx`
- Modify: `apps/extension/manifest.json`
- Create: `README.md`

**Step 1: Privacy policy page** — data collection, extension access scope, storage, CCPA/GDPR rights.

**Step 2: Terms of service** — non-refundability, resale prohibition, account suspension, liability limits.

**Step 3: Finalize extension manifest** — final description, correct host permissions for all 10 retailers, icons.

**Step 4: README** — setup instructions, environment variables, local dev workflow, seed demo data, deployment guide.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add legal pages, finalize extension manifest, and project documentation"
```

---

## Execution Order & Dependencies

```
Task 1 (scaffold) --> Task 2 (types) --> Task 3 (supabase)
                                              |
                                    +---------+----------+
                                    v                    v
                              Task 4 (inv. core)   Task 6 (stacking algo)
                                    |                    |
                                    v                    |
                              Task 5 (inv. routes)       |
                                    |                    |
                                    +--------+-----------+
                                             v
                                       Task 7 (API routes)
                                             |
                                    +--------+----------+
                                    v                   v
                              Task 8-12 (website)  Task 13-15 (extension)
                                    |                   |
                                    +--------+----------+
                                             v
                                    Task 16 (bridge)
                                             |
                                             v
                                    Task 17 (demo flow)
                                             |
                                             v
                                    Task 18-20 (security & polish)
```

**Parallelizable pairs:**
- Task 4 + Task 6 (inventory service core + stacking algorithm)
- Tasks 8-12 + Tasks 13-15 (website UI + extension — both depend on API routes)
