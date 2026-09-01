# Stashly (Gift Hauls) - Dreelio Version Design System
# Design Reference: Dreelio Framer Template (dreelio.framer.website)

## Brand Identity
Stashly is a premium gift card marketplace. This version uses a bright, professional SaaS aesthetic with a sky/cloud motif, 3D perspective transforms, glassmorphism nav, smooth scroll animations, and a warm neutral palette. The feeling is "trustworthy software product" rather than "flashy fintech."

---

## Typography

**Primary Font:** Outfit (Google Fonts) - weights 300, 400, 500, 600, 700

**Hierarchy (Desktop):**
- Hero headline: 64-72px, weight 500, letter-spacing -0.03em, line-height 1.08, centered, italic
  - Dreelio uses italicized hero headlines for personality
- Section headline: 44-52px, weight 500, letter-spacing -0.02em, line-height 1.12, centered
- Section label: 13-14px, weight 500, letter-spacing 0.08em, uppercase, muted brown (#8A7A6A)
- Feature title: 32-40px, weight 500, letter-spacing -0.02em, line-height 1.15
- Body large: 18-20px, weight 400, line-height 1.65, color muted (#6B6B6B)
- Body: 16px, weight 400, line-height 1.6
- Nav links: 15px, weight 400
- Feature pill labels: 15px, weight 400, with icon

**Hierarchy (Mobile):**
- Hero: 38-44px
- Section: 30-36px
- Body: 16px minimum

**Rules:**
- Hero headlines use italic weight for warmth and personality
- Section labels (above headlines) are always uppercase, small, muted brown
- Body text is consistently #6B6B6B, never full black
- Feature card titles can be bold (600) for emphasis
- Bold key phrases in body text for scannability (e.g., "Create branded invoices, log expenses...")

---

## Color Palette

```css
:root {
  /* Backgrounds */
  --color-bg-sky:          #E8EFF7;    /* light blue-gray sky, hero and closing sections */
  --color-bg-warm:         #F5F0E8;    /* warm cream/beige for main content sections */
  --color-bg-warm-light:   #FAF7F2;    /* lighter warm for alternating */
  --color-bg-pricing:      #E4EBF3;    /* light blue for pricing section */
  --color-surface:         #FFFFFF;

  /* Cloud overlay */
  --color-cloud:           rgba(255,255,255,0.7);  /* semi-transparent cloud elements */

  /* Dark elements */
  --color-dark:            #1A1A1A;    /* nav, CTA buttons, dark accents */

  /* Text */
  --color-text-primary:    #1A1A1A;    /* headlines */
  --color-text-body:       #6B6B6B;    /* body, descriptions */
  --color-text-muted:      #8A7A6A;    /* section labels, captions - warm muted brown */
  --color-text-green:      #2D7A2F;    /* positive stats, savings badges */
  --color-text-red:        #D32F2F;    /* negative stats */

  /* Accent */
  --color-accent:          #1A1A1A;    /* primary CTA is dark/black, NOT colored */
  --color-accent-text:     #FFFFFF;
  --color-highlight-blue:  rgba(147, 197, 253, 0.3);  /* light blue glow behind featured pricing card */
  --color-highlight-green: #22C55E;    /* green for "Save 20%" badge */

  /* Feature card gradients (subtle colored shadows behind UI mockups) */
  --color-glow-blue:       rgba(147, 197, 253, 0.4);
  --color-glow-peach:      rgba(255, 200, 150, 0.3);

  /* Utility */
  --color-border:          #E8E3DB;
  --color-border-card:     rgba(0,0,0,0.06);
}
```

**Rules:**
- The overall palette is warm neutrals (cream/beige) with sky-blue sections at top and bottom
- CTAs are BLACK, not colored. This is a key Dreelio trait.
- UI mockup cards have subtle colored glows behind them (blue or peach)
- Cloud imagery appears in hero and closing sections, creating a dreamy sky motif
- The pricing section uses a light blue background
- No orange, no chartreuse, no vibrant accent colors. The design is restrained.

---

## Navigation

```css
.nav {
  position: sticky;
  top: 16px;
  z-index: 100;
  width: fit-content;
  margin: 0 auto;
  padding: 12px 24px;
  border-radius: 999px;             /* floating pill, like Wallet */
  transition: background 0.3s ease, backdrop-filter 0.3s ease;
}

/* Initial state: transparent bg (over sky/cloud hero) */
.nav--transparent {
  background: transparent;
}

/* Scrolled state: glass effect */
.nav--glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
}

.nav-logo { color: var(--color-dark); font-weight: 600; font-size: 18px; }
.nav-link { color: var(--color-text-primary); font-size: 15px; font-weight: 400; }
.nav-cta {
  background: var(--color-dark);
  color: white;
  padding: 12px 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
}
```

**Key behavior:** The nav starts transparent over the sky/cloud hero, then transitions to a glass/frosted effect as the user scrolls past the hero section. This is a signature Dreelio effect.

---

## Buttons

```css
/* Primary CTA - Black pill */
.btn-primary {
  background: var(--color-dark);
  color: white;
  padding: 16px 32px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  transition: all 0.25s ease;
}
.btn-primary:hover {
  background: #333;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

/* Secondary CTA - Outlined */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  padding: 16px 32px;
  border-radius: 999px;
  border: 1.5px solid var(--color-border);
  font-size: 16px;
  font-weight: 500;
}
.btn-secondary:hover {
  border-color: var(--color-text-primary);
  background: rgba(0,0,0,0.02);
}

/* Feature pills - Small outlined tags */
.feature-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 15px;
  color: var(--color-text-primary);
  background: white;
}
```

---

## Effects & Animations (DREELIO'S CORE DIFFERENTIATORS)

### 1. 3D Perspective Dashboard Mockup (Hero)
The hero features a large dashboard/product screenshot that starts tilted upward (3D perspective) and smoothly rotates to face the user as they scroll down.

```css
.hero-mockup {
  perspective: 1200px;
  transform-style: preserve-3d;
}
.hero-mockup-inner {
  transform: rotateX(25deg) scale(0.9);  /* initial tilted state */
  transition: transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1);
  border-radius: 16px;
  box-shadow: 0 40px 80px rgba(0,0,0,0.12);
  overflow: hidden;
}
/* As user scrolls, JavaScript interpolates rotateX from 25deg to 0deg */
/* and scale from 0.9 to 1.0 */
```

### 2. Glassmorphism Nav Transition
Nav starts transparent, transitions to frosted glass on scroll. Trigger at ~100px scroll.

### 3. Scroll-Triggered Fade-Up Reveals
Every section fades up smoothly as it enters the viewport:
```css
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
/* Stagger children left-to-right */
.stagger-left > *:nth-child(1) { transition-delay: 0ms; }
.stagger-left > *:nth-child(2) { transition-delay: 120ms; }
.stagger-left > *:nth-child(3) { transition-delay: 240ms; }
```

### 4. Subtle Parallax on Scroll for Feature Mockups
Feature section mockups (project management, financial) have a slight upward drift as the user scrolls past them:
```css
/* Apply via JS: translate mockup Y position based on scroll offset */
/* Movement: ~20-40px over the section's scroll range */
/* Use transform: translateY() with requestAnimationFrame for smoothness */
```

### 5. Image Zoom-Out on Scroll
The full-width lifestyle photo ("Work from anywhere") has a slight zoom-out effect as user scrolls past:
```css
.zoom-image {
  transform: scale(1.05);
  transition: transform 0.8s ease;
}
.zoom-image.scrolled {
  transform: scale(1.0);
}
```

### 6. Dual-Direction Logo Carousel
Integration logos scroll in opposite directions (top row right-to-left, bottom row left-to-right):
```css
.carousel-row-1 {
  animation: scroll-left 25s linear infinite;
}
.carousel-row-2 {
  animation: scroll-right 25s linear infinite;
}
@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes scroll-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
```

### 7. Testimonial Carousel
Smooth horizontal scrolling carousel with testimonial cards. One featured large quote at top, smaller cards below scrolling.

### 8. Pricing Cards Staggered Fade-Up
Three pricing cards fade up with left-to-right stagger. Center card has a blue glow/highlight border.

### 9. Cloud Parallax (Closing Section)
Real-looking cloud images in the background of the closing CTA section drift inward / close together as the user scrolls to the very bottom. Creates a "flying through clouds" sensation.

```css
.cloud-left {
  transform: translateX(-20%);
  transition: transform 1s ease;
}
.cloud-right {
  transform: translateX(20%);
  transition: transform 1s ease;
}
/* On scroll near bottom, both converge toward center */
.cloud-left.converged { transform: translateX(0); }
.cloud-right.converged { transform: translateX(0); }
```

### 10. Smooth Scrolling
```css
html { scroll-behavior: smooth; }
```

---

## Section-by-Section Layout

### 1. Hero (Sky Background with Clouds)
- Background: --color-bg-sky with real cloud imagery (semi-transparent PNGs)
- Nav starts transparent, becomes glass on scroll
- Large centered italic headline: "Save on every gift card like a pro"
- Centered muted description
- Two buttons side by side: "Try Stashly free" (black pill) + "See features" (outlined pill)
- Below: large 3D-tilted dashboard mockup showing Stashly's gift card inventory/browse UI
- Mockup smoothly rotates to face user on scroll

### 2. Product Dashboard Mockup (Warm Background)
- Full dashboard screenshot with sidebar, stats cards, charts
- For Stashly: show gift card inventory dashboard with KPIs (Total savings, Cards purchased, Rewards points, etc.)
- Stats cards show green/red percentage changes
- Below mockup: "Trusted by X+ happy customers" + scrolling brand logo ticker

### 3. Feature: Browse & Discover (Split Layout)
- Section label: "GIFT CARD MARKETPLACE" (uppercase, muted brown)
- Headline: "Work from anywhere, stay in sync" -> adapt to "Browse thousands of gift cards, all in one place"
- Full-width lifestyle photo with slight zoom-out on scroll
- Or: phone mockup showing Stashly mobile experience

### 4. Feature: Project Management -> Order Management (Split Layout)
- Left: UI mockup card with subtle blue glow behind it (showing order list/tracking)
- Right: headline + description + CTA + feature pills
- Feature pills: "Order Tracking", "Instant Delivery", "Purchase History", "Rewards"
- Mockup has slight parallax movement on scroll

### 5. Feature: Financial Management -> Savings Tracking (Split Layout)
- Reversed layout: headline left, mockup right
- Mockup shows savings dashboard (budget used vs. face value, analytics chart)
- Feature pills: "Savings Calculator", "Budget Tracking", "Price Alerts", "Bulk Discounts"

### 6. Benefits Grid (Warm Background)
- Section label: "FEATURES"
- Centered headline: "Built for smart shoppers, powered by simplicity"
- Two-column card grid:
  - Left card: "Personalize every detail" - color swatches, theme toggle for Stashly preference settings
  - Right card: "Integrates with the tools you already use" - dual-direction logo carousel (payment methods: Stax, PayPal, Venmo, Zelle, Apple Pay)

### 7. Testimonials (Light Gray Background)
- Large featured quote centered at top (40-52px, near full-width)
- Customer avatar + name + title below the quote
- Below: horizontal scrolling carousel of smaller testimonial cards
- Cards: white surface, subtle border, quote text + avatar + name + role

### 8. Pricing (Light Blue Background)
- Section headline: "Simple plans for serious savings"
- Annual/Monthly toggle switch
- 3 pricing cards in a row:
  - Free tier, Premium tier (highlighted with blue glow border + "Save 20%" green badge), Enterprise
  - Each: plan name, price, description, feature checklist with checkmarks, CTA button
  - Center card CTA is black filled, side cards are outlined
- Cards fade up left-to-right on scroll

### 9. Closing CTA (Sky Background with Converging Clouds)
- Background: --color-bg-sky with cloud images that drift inward on scroll
- Centered headline: "Ready to start saving"
- Muted description: "Browse gift cards for free. No credit card required."
- Black pill CTA button

### 10. Footer (Inside the sky section)
- Light card with rounded corners containing:
  - Logo + description left
  - Two columns of links (Pages, Information)
  - Social icons (LinkedIn, X)
- Copyright line at bottom

---

## Spacing

8px base grid. Dreelio uses generous but slightly tighter spacing than Wallet.

- Between major sections: 120-140px (desktop), 72-88px (mobile)
- Section label to headline: 12px
- Headline to description: 16-20px
- Description to content: 40-56px
- Container max-width: 1200px
- Side padding: 32px desktop, 20px mobile
- Card padding: 32-40px
- Card border-radius: 16-20px

---

## UI Mockup Card Style

Dreelio's feature sections use UI mockup cards that look like real app screenshots with colored glows behind them:

```css
.mockup-card {
  background: white;
  border-radius: 16px;
  border: 1px solid var(--color-border-card);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
  position: relative;
}

/* Colored glow behind the card */
.mockup-card::before {
  content: '';
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: var(--color-glow-blue);
  filter: blur(40px);
  z-index: -1;
  border-radius: 24px;
}
```

---

## ANTI-PATTERNS

1. No dark mode sections. Dreelio is entirely light. The only dark elements are nav, buttons, and the small CTA fills.
2. No vibrant accent colors. CTAs are black. The only color pops are green (stats/badges) and subtle blue (glows/pricing highlight).
3. No heavy drop shadows. Shadows are barely perceptible (rgba(0,0,0,0.04-0.06)).
4. No generic cloud stock photos. Use soft, realistic cloud PNGs with transparency.
5. No emoji in UI elements.
6. No placeholder text.
7. Body text is NEVER full black.
8. Do not skip the 3D perspective mockup in the hero. It is the signature effect.
9. Do not skip the glass nav transition. It is the second signature effect.
10. Do not skip the converging clouds in the closing section.
11. Feature pills must have icons. Text-only pills look generic.
12. The italic hero headline is intentional and distinctive. Do not use regular weight.
13. Do not use colored backgrounds behind testimonial cards. They sit on light gray.
14. The pricing highlight card uses a SUBTLE blue glow, not a heavy colored border.
