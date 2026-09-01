# Hybrid Marketplace Aggregation

**Date:** 2026-08-31
**Status:** Implemented (demo-mode providers; live partners pending agreements)

## What changed

Stashly moved from a pure first-party model (only our inventory) to a **hybrid**: every price surface now compares Stashly's own inventory against partner gift card marketplaces — **CardCash, Raise, GCX, and GiftCardWiki** — and shows the user the best rate, wherever it lives.

- Stashly inventory wins → user buys in-app (instant delivery, stacking, balances).
- A partner wins → user follows an affiliate link-out to that marketplace.

This keeps revenue on both branches (card margin in-app, commission on link-outs) while making the savings claim honest: "the best rate we can find," not "our rate."

## Architecture

```
apps/web/src/services/marketplace/
├── types.ts                 MarketplaceProvider interface, timeouts
├── fixtures.ts              Demo rate tables + storefront URL builder
├── aggregator.ts            compareRates(): merge, rank, cache, estimate
└── providers/
    ├── stashly.ts           Our inventory as a provider (fulfillment: instant)
    └── partners.ts          CardCash / Raise / GCX / GiftCardWiki adapters
```

Mirrors the payment-adapter pattern: one interface, demo fixtures now, live
API credentials drop in per-partner later (`CARDCASH_API_KEY`, etc.) without
touching consumers. None of these marketplaces expose open public APIs, and
scraping is ruled out (ToS violations, silent breakage) — live mode therefore
requires partnership/affiliate agreements, and an unconfigured provider simply
drops out of the comparison.

GiftCardWiki is itself an aggregator, so its quotes carry `via` — the
underlying seller its best rate came from.

## Behavior

- **Ranking:** highest discount wins; ties prefer instant (Stashly) fulfillment.
- **Degradation:** providers run under `Promise.allSettled` with a 2.5s
  per-provider timeout — a slow or failing partner drops out, never sinks the
  comparison ("degrade, don't break").
- **Caching:** 15-minute in-memory TTL per retailer; cart-dependent savings
  estimates recompute per request.
- **Savings estimate:** cart coverage is capped at 5× the source's max card
  value, mirroring typical retailer per-order limits.

## Surfaces

- `GET /api/rates?retailer=Name&cart_total=N` — public (market prices need no
  account), IP rate-limited. Returns a `RateComparison`.
- **Extension overlay** — a "Best prices across marketplaces" section in every
  overlay state (including logged-out); external rows open the marketplace in
  a new tab. Also fixed a latent bug: `background.js` called `api.getStack()`,
  which didn't exist in `utils/api.js`.
- **Web buy page** — `MarketplaceComparison` panel under the stack breakdown,
  with the affiliate-commission disclosure line.

## Open items

- Partner agreements (CardCash has a partner API; Raise/GCX/GiftCardWiki are
  affiliate-first) — each unlocks one adapter's live mode.
- Affiliate tracking parameters on link-outs once program IDs exist.
- Rate-freshness telemetry per partner once live feeds exist (staleness must
  degrade the quote, not mislead the user).
