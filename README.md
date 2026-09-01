# Stashly

**Save on every purchase with stacked, discounted gift cards — applied automatically at checkout.**

Stashly is a gift card marketplace paired with a Chrome extension. Users buy brand gift cards below face value on the website; when they reach the checkout page of a supported retailer, the extension detects it, shows their available balance, and applies their gift cards for them. Buying a $1,000 MacBook with cards purchased at 8% off means paying ~$920 for the same order.

![Stashly extension popup — logged out, logged in, and at-checkout states](docs/screenshots/extension-popup-states.png)

## How it works

1. **Buy** discounted gift cards on the Stashly web app (e.g. $100 Apple card for $92).
2. **Shop** normally at a supported retailer.
3. **Checkout detection** — the extension recognizes the checkout page, reads the cart total, and computes the optimal *stack* of card denominations to cover it.
4. **Price check** — rates are compared across Stashly inventory and partner marketplaces (CardCash, Raise, GCX, GiftCardWiki); the best deal is surfaced, whether it's ours or a link-out.
5. **Apply** — one click fills the gift card fields and presses the retailer's own *Apply* button. The user always places the order themselves; the extension never submits a purchase.

## Architecture

Monorepo with three deployable apps and a shared package:

```
apps/
├── extension/           Chrome extension (Manifest V3, vanilla JS)
│   ├── content/         Checkout detection, overlay UI, auto-apply
│   ├── background.js    Service worker: API relay, caching
│   └── popup/           Balances & savings summary
├── web/                 Next.js 16 app (marketplace, dashboard, admin)
│   ├── src/app/(app)/api/   REST endpoints: /stack, /purchase, /balances, …
│   ├── src/lib/stacking.ts  Greedy denomination-stacking algorithm
│   ├── src/services/marketplace/  Hybrid rate aggregation (Stashly + partners)
│   ├── src/services/payment/  Processor adapter pattern (Stripe test / Stax)
│   └── supabase/        Postgres migrations with row-level security
├── inventory-service/   Express + SQLite service holding card codes
│   ├── src/encryption.ts    AES-256-GCM at rest, key held only by this service
│   └── src/reservation.ts   Stale-reservation expiry job
packages/shared/         Shared TypeScript types and constants
```

Design decisions worth noting:

- **Card codes live in one place.** The inventory service is a separate process on a private network; the web app talks to it over an authenticated internal API and never stores plaintext codes. Codes are AES-256-GCM encrypted at rest.
- **Reservation lifecycle.** Purchases reserve inventory first, then charge — a failed payment returns the reservation to the pool instead of leaking cards, and a background job expires stale holds.
- **Minimal extension permissions.** Host permissions and content-script injection are scoped to the eight supported retailer domains (plus Stashly itself) — the browser refuses to run the extension anywhere else.
- **The extension never places orders.** Auto-apply fills gift card fields and clicks the retailer's own apply button — never the order button. Submitting checkout is always a human action.
- **Hybrid marketplace model.** Every price surface compares Stashly inventory against partner marketplaces behind a provider-adapter interface — best rate wins, in-app when it's ours, affiliate link-out when it isn't. Partners run on demo fixtures until API agreements exist; a failed provider drops out of the comparison instead of breaking it.
- **Payment processor abstraction.** Stripe prohibits gift card resale, so payments go through an adapter interface (`services/payment/`) — Stripe test keys for local development, a Stax adapter for production.
- **Demo mode.** `NEXT_PUBLIC_STASHLY_MODE=demo` serves mock inventory so the full flow can be demonstrated without live payment rails.

The full technical design — API contracts, KYC tiers, fraud/risk engine, checkout-detection scoring, trust zones, failure modes — is in **[docs/stashly-systems-design.md](docs/stashly-systems-design.md)** (20 sections). Earlier design and implementation plans live in [docs/plans/](docs/plans/).

## Running locally

```bash
npm install

# Web app (Next.js) — http://localhost:3000
cp .env.example apps/web/.env.local   # fill in Supabase keys, or set NEXT_PUBLIC_STASHLY_MODE=demo
npm run dev -w apps/web

# Inventory service — http://localhost:3001
npm run dev -w apps/inventory-service

# Extension: chrome://extensions → "Load unpacked" → apps/extension
```

Tests:

```bash
npm test   # all suites: stacking, marketplace aggregation, payment API, webhooks, inventory reservations
```

## Stack

Next.js 16 · React · TypeScript · Supabase (Postgres + Auth + RLS) · Express · SQLite · Chrome Manifest V3 · Vitest · Tailwind CSS

## Status & disclaimer

Portfolio / MVP project. Payments run in test mode only; live gift card sales require processor underwriting and the compliance framework described in the systems design doc. Brand names and logos belong to their respective owners and appear here solely to demonstrate the product concept.
