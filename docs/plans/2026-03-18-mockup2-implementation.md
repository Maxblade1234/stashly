# Mockup_2 Landing Page + Backend Wiring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the entire Stashly landing page with the Mockup_2 design (sky-blue hero, floating glass pill nav, X-shaped brand marquee, scroll-locked phone animation, split feature sections, pricing tiers) and wire real Supabase data.

**Architecture:** Monorepo at `.worktrees/mvp/`. Web app is Next.js 16 + React 19 + Tailwind CSS 4 at `apps/web/`. The current `page.tsx` (1566 lines) is a monolith — we'll decompose into ~10 focused components under `components/landing/`. Layout renders a global `<Navbar>` which must become conditional (landing page gets its own FloatingNav; app pages keep the existing nav).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase (SSR), Outfit font (Google Fonts)

**Design Reference:** `/Mockup_2/index.html` — this is the pixel-perfect source of truth for all styles, spacing, animations, and copy.

**Logo Rules:** Always use transparent-background PNGs from `Brand Logos/` folder. Exception: Riot Games uses `RiotGames.png` (normal, not transparent).

---

## Phase A: Foundation (sequential — blocks everything else)

### Task A1: Copy Brand Logos to Web App Public Directory

**Files:**
- Source: `Brand Logos/*.png` and `Logo/Stashly-Icon-Transparent.png`
- Destination: `apps/web/public/images/brands/` and `apps/web/public/images/`

**Step 1: Copy transparent brand logos**

```bash
cd ".worktrees/mvp/apps/web/public/images/brands"
cp "../../../../../Brand Logos/Apple.png" ./apple.png
cp "../../../../../Brand Logos/ebay-transparent.png" ./ebay.png
cp "../../../../../Brand Logos/microsoft.png" ./microsoft.png
cp "../../../../../Brand Logos/Dominos-Transparent.png" ./dominos.png
cp "../../../../../Brand Logos/Chipotle-Logo.png" ./chipotle.png
cp "../../../../../Brand Logos/RiotGames.png" ./riot-games.png
cp "../../../../../Brand Logos/FanaticsLogo.png" ./fanatics.png
cp "../../../../../Brand Logos/NFLShop-Transparent.png" ./nfl-shop.png
cp "../../../../../Brand Logos/Jersey-Mikes-Logo.png" ./jersey-mikes.png
cp "../../../../../Brand Logos/OffSeason-Transparent.png" ./off-season.png
```

**Step 2: Copy Stashly icon**

```bash
cp "../../../../../Logo/Stashly-Icon-Transparent.png" "../stashly-icon.png"
```

**Step 3: Verify all files exist**

```bash
ls -la apps/web/public/images/brands/*.png | wc -l
# Expected: at least 10
ls apps/web/public/images/stashly-icon.png
# Expected: file exists
```

### Task A2: Update Design System (globals.css)

**Files:**
- Modify: `apps/web/src/app/globals.css`

**Step 1: Replace CSS custom properties block**

Replace the entire `:root { ... }` block (lines 3-23) with:

```css
:root {
  /* Mockup_2 Design System */
  --bg-sky: #E8EFF7;
  --bg-warm: #F5F0E8;
  --bg-light: #FAF7F2;
  --bg-pricing: #E4EBF3;
  --surface: #FFFFFF;
  --dark: #1A1A1A;
  --dark-hover: #333333;
  --text-primary: #1A1A1A;
  --text-body: #6B6B6B;
  --text-muted: #8A7A6A;
  --text-light: #9A9A9A;
  --border: #E8E3DB;
  --border-light: rgba(255,255,255,0.5);
  --glow-blue: rgba(147,197,253,0.3);
  --glow-peach: rgba(255,200,150,0.3);
  --green: #2D7A2F;
  --green-bg: #E8F5E9;
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.06);
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-pill: 999px;

  /* Legacy compat for app pages */
  --background: #FDFAF6;
  --foreground: #1A1A1A;
}
```

**Step 2: Update the `@theme inline` block to reference new vars**

**Step 3: Update `body` style to use `--bg-sky` only on landing, keep `--background` for app pages**

The body background should stay `--background` since layout.tsx controls it. Landing page sections set their own backgrounds.

**Step 4: Add animation utility classes at the bottom of globals.css**

```css
/* Scroll reveal */
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.stagger > .reveal:nth-child(1) { transition-delay: 0ms; }
.stagger > .reveal:nth-child(2) { transition-delay: 120ms; }
.stagger > .reveal:nth-child(3) { transition-delay: 240ms; }
.stagger > .reveal:nth-child(4) { transition-delay: 360ms; }

/* Carousel animations */
@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes scroll-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
```

### Task A3: Update Layout to Conditionally Render Nav

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

**Step 1: Remove the `<Navbar />` from layout**

The landing page will have its own FloatingNav. App pages (dashboard, etc.) will import and render their own Navbar. Remove the global `<Navbar />` and `<main className="pt-16">` wrapper from layout.tsx. Just render `{children}` inside `<body>`.

**Step 2: Remove `style={{ backgroundColor: "#FDFAF6" }}` from body**

The landing page sets its own section backgrounds. App pages will set theirs. Body should have no forced background.

**Step 3: Commit foundation changes**

```bash
git add -A
git commit -m "feat: update design system to Mockup_2 direction, copy brand logos"
```

---

## Phase B: Landing Page Components (parallelizable — each is independent)

All components go in `apps/web/src/components/landing/`. Each is a standalone `'use client'` component.

### Task B1: FloatingNav Component

**Files:**
- Create: `apps/web/src/components/landing/FloatingNav.tsx`

**Implementation:**
- Sticky positioned, centered pill-shaped nav
- Initially transparent, adds glass effect (`backdrop-filter: blur(20px)`, white bg at 0.72 opacity, border, shadow) after scrolling 100px
- Contents: Stashly icon + "Stashly" text | 3 nav links (Features, Pricing, Reviews) | dark pill CTA "Get started"
- Mobile: hide links, show hamburger icon
- Use `useEffect` with scroll listener for glass transition
- All styles inline (matching mockup exactly) — no Tailwind for complex animation styles
- Logo: `/images/stashly-icon.png` via next/image

**Key CSS from mockup:**
```css
/* Nav pill: */
width: fit-content; margin: 0 auto; padding: 12px 12px 12px 24px;
border-radius: 999px; gap: 32px;
/* Glass state: */
background: rgba(255,255,255,0.72); backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.5);
box-shadow: 0 4px 16px rgba(0,0,0,0.06);
```

### Task B2: HeroSection Component

**Files:**
- Create: `apps/web/src/components/landing/HeroSection.tsx`

**Implementation:**
- Sky-blue background (`#E8EFF7`)
- 4 CSS pseudo-element clouds (positioned absolutely, white with varying opacity)
- Hero content: centered, max-width 800px
  - Italic headline: "Save on every gift card like a pro" (clamp 40-72px, weight 500, italic)
  - Body text: "Browse thousands of discounted gift cards..." (19px, centered, max-width 540px)
  - Two buttons: primary dark pill "Try Stashly free" (with arrow icon) + secondary bordered "See features"
- 3D perspective dashboard mockup below:
  - `perspective: 1200px` wrapper
  - Dashboard panel starts at `rotateX(25deg) scale(0.92)`, transitions to flat on scroll
  - Dashboard shows: header with Stashly logo + nav tabs, sidebar with icons, 4 stat cards, transaction table with real brand logos
  - Transaction table rows: Apple $100 -8.5% Delivered, Chipotle $50 -12% Delivered, Microsoft $200 -6.2% Processing, Domino's $25 -15% Delivered, eBay $75 -9.8% Pending
- Scroll listener: when `scrollY > 300`, add `.flat` class (rotateX(0) scale(1))

### Task B3: BrandMarquee Component

**Files:**
- Create: `apps/web/src/components/landing/BrandMarquee.tsx`

**Implementation:**
- Transparent background, padding 60px 0
- Wrapper rotated -4deg (`transform: rotate(-4deg); margin: 0 -40px`)
- Two rows of logos:
  - Row 1: scrolls left (CSS animation `scroll-left 35s linear infinite`)
  - Row 2: scrolls right (CSS animation `scroll-right 35s linear infinite`), margin-top 24px
- Each row: logos duplicated for seamless loop
- Logos: 36px height, opacity 0.35, hover 0.6
- Microsoft logo: `transform: scale(1.8)` (it's small)
- Edge fade gradients: `linear-gradient(to right, var(--bg-sky), transparent)` 120px wide on each side
- Brand order (row 1): Apple, eBay, Microsoft, Domino's, Chipotle, Riot Games, Fanatics, NFL Shop, Jersey Mike's, OffSeason (then duplicated)
- Row 2: reverse order

### Task B4: PhoneDemo Component (scroll-locked animation)

**Files:**
- Create: `apps/web/src/components/landing/PhoneDemo.tsx`

**Implementation:**
- Section header: label "Gift Card Marketplace" + headline "Browse thousands of gift cards, all in one place" + body text
- `bg-light` background (#FAF7F2), padding-top 140px
- Scroll-lock container: 100vh, flex centered
- Phone mockup: 320px wide, min-height 680px, dark bezels (10px #1A1A1A border), 48px border-radius
  - Notch: 100px wide, 30px tall, dark, centered
  - Status bar: "9:41" left, signal/wifi/battery SVGs right
- 3-layer system (positioned absolute, transitions with translateX):
  - **Layer 1 (card list):** Search bar + category pills (All active, Dining, Retail, Gaming, Travel) + scrollable card list
    - Cards: Apple -8.5%, Chipotle -12%, Domino's -15%, eBay -9.8%, Microsoft -6.2%, Starbucks -14%, Target -5%, Nike -10%, Uber Eats -8%
    - Cards without brand logos use colored circle initials (S green, T red, N black, U green)
  - **Layer 2 (detail):** Back button, Domino's logo, pricing breakdown (value $25, retail $25 strikethrough, your price $21.25 green, savings 15% tag), quantity control, "Add to Cart" button
  - **Layer 3 (confirm):** Animated SVG checkmark (circle draws then check draws), "Order Confirmed!", savings $3.75, detail box, green "Done" button, confetti particles
- Scroll hijack: `wheel` + `touchstart/touchmove` handlers
  - Lock when container top ≤20px from viewport top
  - `SCROLL_SENSITIVITY = 0.0005` for wheel
  - Progress 0→1 drives 5 phases
  - Release after 800px overflow at boundaries
- Progress dots: 5 dots on right side, active dot is dark + scaled 1.4x
- Phase rendering: exactly as in mockup JS (see design doc)
- Confetti: 24 dots + 8 star characters, burst animation with CSS custom properties

### Task B5: FeatureSection Component (reusable split layout)

**Files:**
- Create: `apps/web/src/components/landing/FeatureSection.tsx`

**Implementation:**
- Reusable component with props: `{ label, headline, bodyText, ctaText, pills, visual, reversed?, bgClass }`
- Grid: `grid-template-columns: 1fr 1fr; gap: 80px; align-items: center`
- When `reversed`, visual gets `order: -1`
- Text side: label (uppercase 13px) + headline (clamp 28-40px) + body + primary CTA button + feature pills row
- Feature pills: white bg, 1px border, pill radius, icon + text (14px, 500 weight)
- Mobile: single column, gap 48px

**Two instances on the landing page:**

**Instance 1: Order Management** (bg-warm #F5F0E8)
- Visual (left): Order mockup card with blue glow
  - "Recent Orders" header + "This month" filter
  - 5 order rows: Apple $91.50 Delivered, Chipotle $44.00 Delivered, Microsoft $187.60 Processing, Domino's $21.25 Delivered, eBay $67.65 Pending
  - Each row: brand logo icon (40px rounded) + name + date + amount + status badge
- Text (right): "Order Management" label, "Track every order, celebrate every save" headline
- Pills: Order Tracking, Instant Delivery, Purchase History, Rewards

**Instance 2: Savings Analytics** (bg-light #FAF7F2, reversed)
- Text (left): "Savings Analytics" label, "Watch your savings grow in real-time" headline
- Visual (right): Savings mockup card with peach glow
  - "Total Saved $2,847.50" header + "Last 6 months" period
  - Budget bar: $680 / $1,000 (68% fill)
  - Bar chart: Oct 45%, Nov 62%, Dec 85%, Jan 55%, Feb 70%, Mar 92%
  - Legend: Savings (dark) / Spend (gray)
- Pills: Savings Calculator, Budget Tracking, Price Alerts, Bulk Discounts

### Task B6: BenefitsGrid Component

**Files:**
- Create: `apps/web/src/components/landing/BenefitsGrid.tsx`

**Implementation:**
- Warm bg (#F5F0E8), padding 140px 0
- Header: "Features" label + "Built for smart shoppers, powered by simplicity" headline + body text
- 2x2 grid (single column on mobile), gap 24px
- **Card 1: Personalize**
  - Title + description
  - 5 color swatches (circles): #1A1A1A (active with dark border), #6366F1, #EC4899, #F59E0B, #10B981
  - Dark mode toggle mockup: label + toggle track + thumb
- **Card 2: Payment Methods**
  - Title + description
  - Two-row scrolling payment carousel:
    - Row 1 (left): Apple Pay, Google Pay, PayPal, Venmo, Visa, Mastercard (duplicated)
    - Row 2 (right): Amex, Discover, Cash App, Zelle, Stripe, ACH (duplicated)
  - Gray pill items (15px, #F5F5F5 bg)
  - Fade gradients on edges

### Task B7: TestimonialsSection Component

**Files:**
- Create: `apps/web/src/components/landing/TestimonialsSection.tsx`

**Implementation:**
- Light bg (#FAF7F2), padding 140px 0
- Featured quote: large italic text (clamp 28-44px) centered, max-width 800px
  - Quote: "Stashly completely changed how our team handles employee rewards..."
  - Author: avatar circle "JM" dark bg + "Jessica Martinez" + "Head of People, Meridian Labs"
- Scrolling card carousel below:
  - 6 testimonial cards, duplicated for seamless loop
  - Each card: 340px wide, text + author (avatar circle + name + role)
  - CSS animation: `scroll-left 45s linear infinite`
  - Fade gradients on edges
  - Authors: David Kim (purple), Sarah Rodriguez (pink), Alex Thompson (amber), Maria Liu (green), Ryan Nakamura (violet), Patricia Wells (red)

### Task B8: PricingSection Component

**Files:**
- Create: `apps/web/src/components/landing/PricingSection.tsx`

**Implementation:**
- Pricing bg (#E4EBF3), padding 140px 0
- Header: "Pricing" label + "Simple plans for serious savings" headline + body text
- Toggle: Monthly/Annual pill switcher + "Save 20%" green badge
  - `useState` for period, toggles `.active` class + updates price amounts
- 3-column grid (single column on mobile), max-width 1060px:
  - **Free:** $0/month, 4 features (5 purchases, basic dashboard, all brands, email support), secondary CTA
  - **Premium:** $9.99 monthly / $7.99 annual, "Most Popular" badge, 6 features (unlimited, +3%, analytics, 2x rewards, price alerts, priority support), primary CTA, highlighted card with blue glow border gradient
  - **Enterprise:** Custom, 6 features (everything in Premium, +5% bulk, team dashboard, custom workflows, API, dedicated AM), secondary CTA
- Check icon SVG for each feature row (green #2D7A2F)
- Highlighted card CSS: `box-shadow: 0 0 0 1px rgba(147,197,253,0.3), 0 0 40px rgba(147,197,253,0.15)` + gradient border via `mask-composite: exclude`

### Task B9: ClosingCTA + Footer Components

**Files:**
- Create: `apps/web/src/components/landing/ClosingCTA.tsx`
- Create: `apps/web/src/components/landing/Footer.tsx`

**ClosingCTA:**
- Sky-blue bg, padding 140px 0 80px, overflow hidden
- Two cloud SVGs (left + right), positioned absolute
  - Each: 300x180 SVG with overlapping white ellipses at 0.5 opacity
  - Parallax: scroll listener moves them inward (translateX ±100px based on scroll progress)
- Centered content: "Ready to start saving" headline + body + primary CTA button

**Footer:**
- Sky-blue bg, padding 0 24px 40px
- White rounded card (20px radius, 48px padding, max-width 1280px)
- Top: 3-column grid (1.5fr 1fr 1fr)
  - Brand: logo + "Stashly" text + brand description paragraph
  - Pages: Home, Features, Pricing, Reviews
  - Info: Terms, Privacy, Support, Contact
- Bottom: copyright "2026 Stashly" + social icons (LinkedIn, X SVGs in gray circles)

---

## Phase C: Page Assembly + Layout Wiring

### Task C1: Assemble Landing Page

**Files:**
- Rewrite: `apps/web/src/app/page.tsx`

**Step 1: Replace the entire 1566-line page.tsx with:**

```tsx
import FloatingNav from '@/components/landing/FloatingNav';
import HeroSection from '@/components/landing/HeroSection';
import BrandMarquee from '@/components/landing/BrandMarquee';
import PhoneDemo from '@/components/landing/PhoneDemo';
import FeatureSection from '@/components/landing/FeatureSection';
import BenefitsGrid from '@/components/landing/BenefitsGrid';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import ClosingCTA from '@/components/landing/ClosingCTA';
import Footer from '@/components/landing/Footer';

// Feature section data imported from a data file or defined here

export default function Home() {
  return (
    <>
      <FloatingNav />
      <HeroSection />
      <BrandMarquee />
      <PhoneDemo />
      {/* Order Management — visual left, text right */}
      <FeatureSection variant="order-management" />
      {/* Savings Analytics — text left, visual right */}
      <FeatureSection variant="savings-analytics" reversed />
      <BenefitsGrid />
      <TestimonialsSection />
      <PricingSection />
      <ClosingCTA />
      <Footer />
    </>
  );
}
```

**Step 2: Add scroll reveal observer**

Either in a `ScrollReveal` utility component or via a `useEffect` in page.tsx that queries all `.reveal` elements and observes them with `IntersectionObserver`.

### Task C2: Update App Page Layouts

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx` (add `<Navbar />` import at top)
- Modify: `apps/web/src/app/gift-cards/page.tsx` (add `<Navbar />` import)
- Same for: `/admin/*`, `/login`, `/signup`, `/settings`, `/history`

Since we removed `<Navbar />` from layout.tsx, every non-landing page needs to import and render its own `<Navbar />`. Alternatively, create a `(app)` route group with its own layout that includes `<Navbar />`.

**Recommended approach: Route groups**
```
apps/web/src/app/
├── page.tsx                    (landing — no shared nav)
├── layout.tsx                  (root layout — just html/body)
├── (app)/
│   ├── layout.tsx              (imports <Navbar />, adds pt-16)
│   ├── dashboard/page.tsx
│   ├── gift-cards/...
│   ├── admin/...
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── settings/page.tsx
│   ├── history/page.tsx
│   ├── privacy/page.tsx
│   └── terms/page.tsx
```

This way, all app pages automatically get the old Navbar, and the landing page is isolated.

### Task C3: Commit and Verify

```bash
git add -A
git commit -m "feat: rebuild landing page with Mockup_2 design system"
```

Start dev server and verify each section renders correctly against the mockup.

---

## Phase D: Backend Wiring (parallelizable with Phase B)

### Task D1: Verify Supabase Retailers Data

**Files:**
- Check: `apps/web/supabase/seed.sql` or migration files

**Step 1: Verify retailers table has all 10 brands with correct data**

```sql
SELECT name, domain, logo_url, discount_percentage FROM retailers;
```

Update seed data if any brands are missing or logo paths are wrong. Logo paths should match the new filenames in `/images/brands/`.

### Task D2: Create Supabase Data Fetch for Landing Page

**Files:**
- Create: `apps/web/src/lib/data/retailers.ts`

**Implementation:**
- Server-side function `getRetailers()` that fetches from Supabase `retailers` table
- Returns: `{ name, logo, discount, domain, denominations }[]`
- Used by: BrandMarquee, PhoneDemo, HeroSection (dashboard mockup table)
- Fallback: hardcoded array if Supabase fetch fails (for static rendering / build)

### Task D3: Verify Auth Flow Works

**Step 1:** Test login/signup pages still function after layout changes
**Step 2:** Verify `/api/auth/callback` route still handles OAuth
**Step 3:** Test Supabase client creation in both server and client contexts

### Task D4: Commit Backend Wiring

```bash
git add -A
git commit -m "feat: wire Supabase retailer data to landing page components"
```

---

## Execution Order

```
Phase A (sequential):
  A1 → A2 → A3 → commit

Phase B (parallel — all independent):
  B1 (FloatingNav)
  B2 (HeroSection)
  B3 (BrandMarquee)
  B4 (PhoneDemo)
  B5 (FeatureSection x2)
  B6 (BenefitsGrid)
  B7 (TestimonialsSection)
  B8 (PricingSection)
  B9 (ClosingCTA + Footer)

Phase C (after B completes):
  C1 → C2 → C3

Phase D (parallel with B):
  D1 → D2 → D3 → D4
```

**Estimated component count:** 10 new files, 3 modified files, ~3000-4000 lines of new code total.
