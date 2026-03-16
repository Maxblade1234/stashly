# Stashly — Architecture Design Document

**Date:** 2026-03-15
**Status:** Approved

## Overview

Stashly is a Chrome extension + web platform that saves users money at online checkout by offering discounted gift cards purchased from existing inventory. The extension detects supported retailers at checkout, calculates an optimal gift card stack, and facilitates purchase and auto-application in one flow.

The MVP targets ~10 retailers (Apple, Chipotle, Domino's, Riot Games, eBay, New Era, NFL, Jersey Mike's, Off Season, Fanatics) using manually sourced gift card inventory. A demo mode allows live pitching without consuming real inventory or processing payments.

## Tech Stack

- **Website + API:** Next.js (Vercel)
- **Database + Auth:** Supabase (Postgres)
- **Inventory Service:** Node.js/Express (Railway or Render)
- **Chrome Extension:** Vanilla JS, Manifest V3
- **Payment Processor:** TBD (research StaxPayments and alternatives — Stripe is excluded due to ToS restrictions on gift card resale)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                       │
│                                                             │
│  ┌──────────────────┐        ┌───────────────────────────┐  │
│  │ Stashly Extension│        │   Stashly Website          │  │
│  │ (Manifest V3)    │        │   (Next.js on Vercel)      │  │
│  │                  │        │                             │  │
│  │ • Detect retailer│        │ • Dashboard / Stashly bal.  │  │
│  │ • Read cart total │        │ • Purchase flow             │  │
│  │ • Show overlay   │        │ • Transaction history       │  │
│  │ • Auto-apply code│        │ • Account settings          │  │
│  │ • Check balances │        │ • Admin panel (owner only)  │  │
│  └───────┬──────────┘        └──────────┬──────────────────┘  │
│          │                              │                    │
└──────────┼──────────────────────────────┼────────────────────┘
           │                              │
           │  Auth token (shared session) │
           └──────────┬──────────────────-┘
                      │ HTTPS
                      ▼
           ┌─────────────────────┐
           │   Stashly API       │
           │  (Next.js API Routes)│
           │                     │
           │ • Auth (Supabase)   │
           │ • User management   │
           │ • Purchase logic    │
           │ • Balance tracking  │
           │ • Retailer catalog  │
           └──────────┬──────────┘
                      │
          ┌───────────┼───────────┐
          ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│   Supabase       │   │ Inventory Service │
│   (Postgres)     │   │ (Node.js/Express) │
│                  │   │ on Railway/Render  │
│ • Users          │   │                    │
│ • Transactions   │   │ • Encrypted codes  │
│ • Balances       │   │ • Reservation lock │
│ • Retailer data  │   │ • Admin CRUD       │
│ • Savings history│   │ • Release on pay   │
└──────────────────┘   └──────────────────┘
```

## Chrome Extension Architecture

### File Structure

```
stashly-extension/
├── manifest.json
├── background.js          # Service worker — API calls, auth state
├── content/
│   ├── detector.js        # Retailer detection + cart total reading
│   ├── overlay.js         # Savings overlay UI injection
│   └── auto-apply.js      # Gift card code injection into checkout fields
├── popup/
│   ├── popup.html         # Quick status: logged in?, balances, savings
│   └── popup.js
├── styles/
│   └── overlay.css
└── utils/
    ├── api.js             # API client wrapper
    └── retailers.js       # Retailer config (fetched from API, cached)
```

### Extension Flow

1. **Retailer detection** — Content script matches current domain against retailer config map fetched from API and cached (1-hour TTL, force-refreshable).
2. **Cart total reading** — Uses retailer-specific CSS selectors to read cart total. Falls back to manual amount input if selectors fail.
3. **Overlay presentation** — Calls API with retailer + cart total. API returns optimized gift card stack (never inventory counts). Overlay slides in from bottom-right.
4. **Purchase flow** — User clicks "Save $X" → opens Stashly website purchase page in new tab with retailer, denomination, and return URL pre-filled. Payment completes on website.
5. **Auto-apply** — Extension receives codes via postMessage from website. Loops through: fill code → click apply → wait for confirmation → fill next code. Falls back to copy/paste if selectors fail.
6. **Stashly balance check** — On every supported retailer checkout, checks API for existing balances and offers to auto-apply.

### Permissions (Minimal)

- `activeTab` — only reads current page
- `storage` — caching auth token and retailer configs
- `cookies` — reading auth session from stashly.com domain
- Host permissions: `api.stashly.com` + supported retailer domains

### Gift Card Stacking Algorithm

Runs server-side (never exposes inventory counts). Given a cart total, calculates the optimal combination of available denominations that covers the total with minimum overpayment and maximum discount. Respects per-retailer gift card stacking limits.

Example: $1,037 cart on Apple (max 8 cards per order, $500/day user cap):

```
10x $100 @ $89.50 = $895.00
 1x  $50 @ $44.50 =  $44.50
                     ───────
Total paid:          $939.50
Gift card value:   $1,050.00
Stashly balance:      $13.00
Savings:             $110.50
```

If the retailer's max card limit or user's daily cap is hit, the overlay states the remaining amount to pay with another method.

## Stashly Website

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page — value prop, how it works, install CTA |
| `/login` | Email + password auth |
| `/signup` | Registration with email + phone verification |
| `/dashboard` | Savings summary, Stashly balances, recent activity |
| `/gift-cards` | Browse available gift cards by retailer |
| `/gift-cards/buy` | Purchase flow — confirm stack, pay, receive codes |
| `/history` | Full transaction log with filters |
| `/settings` | Account, payment methods, auto-apply preferences |
| `/admin` | Owner-only: inventory, sales dashboard, retailer config |

### Purchase Flow

1. User arrives from extension or directly → `/gift-cards/buy?retailer=apple&amount=1037`
2. Page shows optimized gift card stack with total cost and savings
3. User confirms → payment form (hosted by payment processor, tokenized)
4. On success: API calls inventory service to release codes (reservation → sold), codes displayed, sent back to extension for auto-apply, residual balance recorded as Stashly balance
5. On failure: reservations released back to available

### Admin Panel

- Inventory view: stock levels by retailer/denomination
- Add inventory: CSV upload or manual entry (retailer, amount, code, PIN, source, cost)
- Sales dashboard: revenue, margins, sell-through rates
- Retailer config: manage domains, selectors, stacking limits

## Database Schema

### Supabase (Main Database)

**users**
- `id` (uuid, PK), `email`, `phone`, `created_at`, `savings_total`, `role` ('user' | 'admin')

**retailers**
- `id` (uuid, PK), `name`, `domain`, `checkout_url_patterns` (text[]), `cart_total_selectors` (text[]), `gift_card_input_selector`, `gift_card_pin_selector`, `apply_button_selector`, `add_another_selector`, `max_gift_cards_per_order`, `available_denominations` (int[]), `per_user_daily_limit_usd`, `stacking_notes`, `is_active`, `logo_url`, `updated_at`

**transactions**
- `id` (uuid, PK), `user_id` (FK), `retailer_id` (FK), `cards_purchased` (jsonb), `total_paid`, `total_value`, `savings`, `residual_balance`, `status` ('pending' | 'completed' | 'failed' | 'refunded'), `payment_processor_id`, `demo` (boolean), `created_at`

**stashly_balances**
- `id` (uuid, PK), `user_id` (FK), `retailer_id` (FK), `balance`, `updated_at`
- Unique constraint on (user_id, retailer_id)

**payment_methods**
- `id` (uuid, PK), `user_id` (FK), `processor_token`, `last_four`, `brand`, `is_default`, `created_at`

### Inventory Service (Separate Database)

**inventory_cards**
- `id` (uuid, PK), `retailer_name`, `denomination`, `code_encrypted` (AES-256), `pin_encrypted` (AES-256), `cost_paid`, `source`, `status` ('available' | 'reserved' | 'sold'), `reserved_at`, `reserved_for_txn`, `sold_at`, `created_at`

**inventory_audit_log**
- `id` (uuid, PK), `card_id` (FK), `action` ('added' | 'reserved' | 'released' | 'sold' | 'expired'), `performed_by`, `created_at`

### Key Data Principles

- Gift card codes never exist in the main Stashly database — only `code_last4` in transaction records
- Codes are AES-256 encrypted at rest, decrypted only at moment of delivery
- Reservation expiry: scheduled job every minute flips cards with `reserved_at` > 10 minutes back to `available`

## Security Architecture

### Authentication
- Supabase Auth: email + password, email verification required
- Secure HTTP-only cookie on `stashly.com`
- Extension reads auth session via `chrome.cookies` API
- JWT tokens: 1-hour expiry, auto-refreshed
- No login form in the extension — prompts user to log in on website

### Inventory Service Security
- No public endpoints — only Stashly API backend can call it (service-to-service API key)
- Admin operations route through Stashly API with role verification
- Encryption key in environment variables, never in code or database
- Codes decrypted only at delivery, never logged

### Payment Security
- Payment processor handles card collection via hosted form / tokenization
- Stashly stores only processor token, last four, and brand
- PCI scope minimized to SAQ-A

### Anti-Abuse Measures

| Threat | Countermeasure |
|--------|---------------|
| Account farming | Phone verification required. One phone = one account. Flag shared payment methods/IPs |
| Resale arbitrage | Per-user daily dollar limits across all retailers ($200/day). ToS prohibiting resale. Flag max-quantity buying patterns |
| Payment fraud (stolen cards) | 24-hour hold on first purchase. AVS match required. Flag new-account + large-purchase velocity |
| Refund/chargeback abuse | Codes non-refundable once revealed. Log delivery timestamps for dispute evidence. One chargeback = account suspension |
| Stashly balance draining | Email notification on every purchase and auto-apply. Optional password requirement for balances over $X |
| Extension reverse engineering | Obfuscate/minify extension code. Pricing, discount rates, and retailer configs fetched from API at runtime (not bundled) |
| Gift card stacking exploits | Retailer config includes `stacking_notes`. Overlay warns users about retailer restrictions |
| Inventory probing | Server-side stacking algorithm. API never returns inventory counts. Per-user caps and rate limits (10 inventory checks/hour, 3 purchases/hour) |

### Data Privacy
- Minimal data collection: email, phone, transaction history, balances
- No browsing data — extension only activates on checkout pages of supported retailers
- CCPA/GDPR: data export and account deletion available in settings
- Privacy policy on website

## Demo Mode vs. Live Mode

Controlled by environment variable: `STASHLY_MODE=demo|live`

| Step | Demo Mode | Live Mode |
|------|-----------|-----------|
| Inventory check | Real (accurate stock levels for demos) | Real |
| Stacking algorithm | Real | Real |
| Payment page | Accepts test cards, no charge | Real payment processor |
| Code delivery | Returns `DEMO-XXXX-XXXX-XXXX` | Releases real encrypted code |
| Inventory status | Card stays `available` | Card moves to `sold` |
| Stashly balance | Tracked but resets daily | Persistent |
| Transaction history | Logged with `demo: true` | Normal |
| Auto-apply | Fills fake code (shows UX flow) | Fills real code |

Seeded demo account with pre-populated history and balances for pitch demos.

## Retailer Configuration

Retailer configs stored in Supabase, fetched by extension (1-hour cache). Adding a new retailer requires no extension update.

```json
{
  "name": "Apple",
  "domain": "apple.com",
  "checkout_url_patterns": ["/shop/checkout"],
  "cart_total_selectors": [".order-total .total-value"],
  "gift_card_input_selector": "#gift-card-code",
  "gift_card_pin_selector": "#gift-card-pin",
  "apply_button_selector": "#apply-gift-card",
  "add_another_selector": ".add-another-payment",
  "max_gift_cards_per_order": 8,
  "available_denominations": [25, 50, 100],
  "per_user_daily_limit_usd": 500,
  "stacking_notes": "May not combine with employee discounts",
  "is_active": true
}
```

Admin workflow: Add retailer in admin panel → enter selectors → test in demo mode → toggle active.

Fallback behavior when selectors break:
- Cart total unreadable → manual amount input
- Gift card field not found → show code for copy/paste
- Extension reports `selector_failed` to API for admin visibility

## Phase 2 (Post-MVP)

- Coupon code testing engine
- Cashback layer
- Retailer partnership APIs for direct gift card provisioning
- Mobile companion app for balance tracking
- Referral program
- Migration from manual inventory to retailer-direct sourcing
- Vault service (AWS Secrets Manager / HashiCorp Vault) for inventory encryption at scale
