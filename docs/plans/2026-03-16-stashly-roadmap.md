# Stashly — Pipeline & Roadmap

**Date:** 2026-03-16
**Status:** Active
**Starting point:** Phase 1 (core MVP) and Phase 2 (payment checkout) complete on `feature/mvp-implementation` branch.

---

## What's Built (Phases 1–2)

| Layer | Status | Details |
|-------|--------|---------|
| **Supabase schema** | ✅ | Users, profiles, retailers, transactions, balances, webhook_events, RLS policies |
| **Stacking algorithm** | ✅ | Greedy denomination-aware optimizer with per-user daily caps |
| **Inventory service client** | ✅ | Reserve → release/unreserve flow with retry |
| **Web app (Next.js)** | ✅ | Dashboard, gift card catalog, buy flow, transaction history, settings, admin panel |
| **Auth** | ✅ | Supabase Auth with middleware protection, signup/login pages |
| **Payment service** | ✅ | Stripe adapter with lazy customer creation, PaymentMethod CRUD |
| **Purchase API** | ✅ | Demo mode (mock) + live mode (charge → release → record), post-charge error isolation |
| **Stripe webhooks** | ✅ | Idempotent handler for payment_intent.succeeded/failed, charge.refunded, dispute.created |
| **Frontend payment** | ✅ | StripeProvider, PaymentInput (Elements), SavedCardPill, PaymentMethodManager |
| **Error handling** | ✅ | Global ErrorBoundary, error states on data-fetching components, zod validation |
| **Chrome extension** | ❌ | Not started — architecture designed but no code |
| **Inventory service** | ❌ | Not started — client abstraction exists, server does not |
| **Deployment** | ❌ | Not deployed — no Vercel project, no Supabase project provisioned |

---

## Phase 3 — Deploy & Demo (Target: this week)

**Goal:** Get a shareable URL running in demo mode so you can pitch Stashly to businesses.

### 3.1 Provision Supabase project
- Create Supabase project (free tier)
- Run migrations (`001_schema.sql`, `002_payment_fields.sql`, `003_webhook_events.sql`)
- Seed retailer catalog (the 10 MVP retailers)
- Copy credentials into `.env.local` and Vercel env vars

### 3.2 Deploy to Vercel
- Link monorepo, set root to `apps/web`
- Set `NEXT_PUBLIC_STASHLY_MODE=demo` (no real payments)
- Verify build passes, all pages load
- Custom domain optional (stashly.app or similar)

### 3.3 Seed demo data
- Create a demo user account
- Insert sample transactions + balances so dashboard isn't empty
- Verify the full demo purchase flow end-to-end on the live URL

**Deliverable:** A URL you can send to potential business partners that shows the full user experience in demo mode.

---

## Phase 4 — Inventory Service (Target: 1 week)

**Goal:** Build the backend that actually stores and manages gift card codes.

### 4.1 Express server scaffold
- Node.js/Express on Railway or Render
- Shared secret auth (API key in header)
- Encrypted-at-rest card storage (AES-256-GCM, key in env var)
- Endpoints: `POST /reserve`, `POST /release`, `POST /unreserve`, `GET /available`

### 4.2 Admin CRUD
- `POST /cards` — bulk import cards (CSV upload)
- `GET /cards` — list with filters (retailer, status, denomination)
- `DELETE /cards/:id` — remove a card
- Status tracking: `available` → `reserved` → `sold` / `available` (on unreserve)

### 4.3 Reservation expiry
- Background job: unreserve cards held >15 minutes without purchase
- Prevents inventory lockup from abandoned checkouts

### 4.4 Wire to web app
- Update `.env` with inventory service URL + API key
- Verify end-to-end: stack → reserve → purchase → release in live mode

**Deliverable:** Working inventory service with encrypted card storage, connected to the web app.

---

## Phase 5 — Payment Processor Swap (Target: 1–2 weeks)

**Goal:** Replace Stripe with a processor that allows gift card resale (Stripe ToS prohibits it).

### 5.1 Research & select processor
- **Stax Payments** — already identified as candidate; contact for sandbox credentials
- **Alternatives:** Square, Authorize.net, PayPal Braintree — evaluate ToS for gift card resale
- Decision criteria: ToS compliance, API quality, pricing, PCI scope

### 5.2 Build adapter
- Implement `PaymentAdapter` interface (already defined in `PaymentService`)
- Methods: `createCustomer`, `chargeCustomer`, `createPaymentMethod`, `listPaymentMethods`, `deletePaymentMethod`
- Swap via `PAYMENT_PROCESSOR` env var — no frontend changes needed

### 5.3 Update webhooks
- New webhook endpoint or modify existing to handle processor-specific event format
- Same idempotency pattern (webhook_events table)

### 5.4 Test in sandbox
- Full purchase flow with test cards
- Refund flow
- Failed payment handling

**Deliverable:** Live payments through a ToS-compliant processor. Stripe code remains as fallback.

---

## Phase 6 — Chrome Extension (Target: 2–3 weeks)

**Goal:** Build the extension that detects retailers at checkout and prompts users to save.

### 6.1 Manifest V3 scaffold
- `manifest.json` with permissions: `activeTab`, `storage`, `cookies`
- Background service worker for API calls and auth state
- Content script injection on retailer domains

### 6.2 Retailer detection
- Match `checkout_url_patterns` from retailer catalog
- Read cart total from DOM using `cart_total_selectors`
- Show savings overlay when a supported retailer is detected

### 6.3 Savings overlay
- Injected iframe or shadow DOM component
- Shows: retailer name, cart total, potential savings, "Save with Stashly" CTA
- CTA opens `stashly.com/gift-cards/buy?retailer=X&amount=Y` in new tab (MVP)

### 6.4 Auth bridge
- Share Supabase session between extension and website via cookies
- Extension popup: login state, quick stats (total savings, recent purchases)
- Redirect to website for signup/login

### 6.5 Auto-apply gift card codes (stretch)
- After purchase, inject codes into retailer's gift card input field
- Use `gift_card_input_selector`, `apply_button_selector` from retailer config
- Handle multi-card stacking with `add_another_selector`

**Deliverable:** Chrome extension that detects supported retailers, shows savings, and redirects to purchase flow. Auto-apply is stretch goal.

---

## Phase 7 — Pre-Launch Hardening (Target: 1 week)

### 7.1 Security audit
- Rate limiting review (current in-memory → Redis for multi-instance)
- Input validation audit (all API routes)
- CORS policy tightening
- CSP headers
- Supabase RLS policy review

### 7.2 E2E testing
- Playwright tests for critical paths: signup → browse → buy → dashboard
- Extension integration tests with Puppeteer
- Payment flow tests with processor sandbox

### 7.3 Monitoring & alerts
- Error tracking (Sentry)
- Uptime monitoring
- Webhook failure alerts
- Inventory low-stock alerts

### 7.4 Legal & compliance
- Privacy policy review (real data handling)
- Terms of service review
- Cookie consent (if needed for extension)

### 7.5 Polish backlog
Items deferred from the Phase 2 polish pass:
- Toast notification system (replace alerts)
- Inline styles → CSS classes/variables
- Debounced retailer search
- Cart total input validation (max 2 decimal places)
- Admin panel improvements (pagination, bulk actions)
- Skeleton loading states

**Deliverable:** Production-ready application with monitoring, tests, and security hardening.

---

## Phase 8 — Launch (Target: after hardening)

### 8.1 Chrome Web Store submission
- Store listing: screenshots, description, privacy practices
- Review process (typically 1–3 business days)

### 8.2 Production deployment
- Supabase Pro plan (if needed for scale)
- Vercel Pro (if needed for bandwidth)
- Production env vars (real processor keys, real inventory service)
- DNS + SSL for custom domain

### 8.3 Seed initial inventory
- Source gift cards for the 10 MVP retailers
- Import into inventory service
- Set initial pricing (discount percentages)

### 8.4 Soft launch
- Invite 10–20 beta users
- Monitor: error rates, purchase completion rate, webhook delivery
- Gather feedback

---

## Future (Post-Launch)

| Feature | Priority | Notes |
|---------|----------|-------|
| **3D Secure / SCA** | High | Required for EU customers; processor-dependent |
| **Email receipts** | High | SendGrid/Resend integration, trigger on purchase |
| **Background job queue** | High | BullMQ or similar for webhook processing, reservation expiry |
| **One-click extension purchase** | Medium | Purchase from overlay without opening website (requires extension payment UI) |
| **Referral program** | Medium | Invite friends → bonus savings credit |
| **Mobile app** | Medium | React Native wrapper or PWA |
| **More retailers** | Ongoing | Expand from 10 to 50+ |
| **Dynamic pricing** | Low | Adjust discounts based on demand/inventory |
| **Admin dispute management** | Low | UI for handling chargebacks in admin panel |
| **Analytics dashboard** | Low | Revenue, user growth, popular retailers |

---

## Immediate Next Actions

1. **Provision Supabase** — create project, run migrations, seed retailers
2. **Deploy to Vercel** — demo mode, get a shareable URL
3. **Contact Stax Payments** — request sandbox credentials for Phase 5
4. **Start inventory service** — Phase 4 can run in parallel with processor research

---

*This roadmap is a living document. Update as phases complete and priorities shift.*
