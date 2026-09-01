# Mockup_2 Landing Page Conversion — Design Doc

**Date:** 2026-03-18
**Status:** Approved

## Overview

Convert `Mockup_2/index.html` into production-ready Next.js components for the Stashly web app. Replace the old Meridian/chartreuse design system entirely with Mockup_2's sky-blue/warm/glass-pill direction. Wire brand data from Supabase.

## New Design System

### Color Palette (replacing old CLAUDE.md vars)
```css
:root {
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
}
```

### Buttons
- **Primary:** Dark pill (#1A1A1A bg, white text, pill radius)
- **Secondary:** Transparent pill with border
- No chartreuse anywhere

### Typography
- Outfit font (unchanged)
- Hero: clamp(40px, 6vw, 72px), weight 500, italic
- Section headlines: clamp(32px, 4vw, 52px), weight 500
- Labels: 13px, uppercase, 0.08em letter-spacing
- Body: 18px, #6B6B6B

### Navigation
- Floating centered glass pill (not full-width dark bar)
- Transparent initially, gains `backdrop-filter: blur(20px)` + white bg on scroll
- Contains: logo, 3 links, dark CTA pill button, mobile hamburger

## Component Architecture

### 1. FloatingNav
- Sticky, centered pill shape
- IntersectionObserver or scroll listener for glass transition at 100px
- Mobile: hide links, show hamburger

### 2. HeroSection
- Sky-blue bg with CSS pseudo-element clouds (4 decorative clouds)
- Italic headline: "Save on every gift card like a pro"
- Two buttons: primary "Try Stashly free" + secondary "See features"
- 3D perspective dashboard mockup (rotateX(25deg) → flat on scroll)
- Dashboard mockup: static HTML/CSS showing Stashly dashboard with real brand logos

### 3. BrandMarquee
- X-shaped layout: `transform: rotate(-4deg)` wrapper
- Two rows: top scrolls left, bottom scrolls right (CSS animation)
- Each row duplicated for seamless loop
- Uses real brand PNGs from Brand Logos folder
- Riot Games: use `RiotGames.png` (not transparent version)
- All others: use transparent versions

### 4. PhoneDemo (scroll-locked)
- Section header with label + headline + body text
- 100vh scroll container with scroll-hijack (wheel + touch)
- iPhone-style phone mockup (dark bezels, notch, status bar)
- 5-phase animation driven by scroll progress:
  - Phase 1 (0-0.25): Card list scrolls down
  - Phase 2 (0.25-0.40): Domino's card highlights (green border/glow)
  - Phase 3 (0.40-0.65): Slide to detail screen, "Add to Cart" taps
  - Phase 4 (0.65-0.85): Slide to confirmation, animated checkmark draws
  - Phase 5 (0.85-1.0): Confetti burst particles
- Progress dots on right side
- Re-engages when scrolling back up

### 5. FeatureSection (Order Management)
- Split grid: visual left, text right
- Visual: "Recent Orders" card with blue glow backdrop + parallax
- Text: label + headline + body + primary CTA + feature pills
- Feature pills: icon + text in bordered pill chips

### 6. FeatureSection (Savings Analytics) — reversed
- Split grid: text left, visual right
- Visual: Savings dashboard mockup with peach glow + bar chart
- Budget progress bar, monthly chart, legend

### 7. BenefitsGrid
- Warm bg, centered header
- 2x2 grid of white cards:
  - Card 1: "Personalize every detail" — color swatches + dark mode toggle mockup
  - Card 2: "Integrates with your payment methods" — dual-row payment method carousel

### 8. TestimonialsSection
- Light bg
- Featured quote: large italic text + author avatar/name/role
- Scrolling carousel of testimonial cards (auto-scroll, duplicated for seamless loop)

### 9. PricingSection
- Blue-tinted bg (#E4EBF3)
- Monthly/Annual toggle with "Save 20%" badge
- 3-column grid:
  - Free ($0) — secondary CTA
  - Premium ($9.99/$7.99) — highlighted with blue glow border, primary CTA
  - Enterprise (Custom) — secondary CTA

### 10. ClosingCTA
- Sky-blue bg with converging cloud SVGs (parallax on scroll)
- Centered headline + body + primary CTA

### 11. Footer
- Sky-blue bg containing a white rounded card
- 3-column: brand desc | Pages links | Info links
- Bottom: copyright + social icons (LinkedIn, X)

## Logo Usage
- **Nav/footer logo:** `Stashly-Icon-Transparent.png` + "Stashly" text
- **Dashboard mockup header:** `Stashly-Icon-Transparent.png`
- **Brand logos in carousels/mockups:** Use transparent PNGs from Brand Logos/
- **Riot Games exception:** Use `RiotGames.png` (normal, not transparent)

## Animations
- Scroll reveal: fade-up (opacity 0→1, translateY 32→0), 0.7s ease
- Stagger: 120ms delay per child
- Parallax: subtle translateY on feature mockups (±40px max)
- 3D mockup: rotateX(25deg) → rotateX(0) on scroll past 300px
- Glass nav: transition over 0.4s
- Phone scroll-lock: wheel + touch handlers with progress-based rendering

## Data from Supabase
- Retailers table provides brand names, domains, logo URLs, discount percentages
- Used in: hero dashboard table, phone card list, order mockup, brand carousel
- Pricing tiers: hardcoded (business decision, not dynamic data)

## Parallel Backend Tasks
- Copy brand logo PNGs into apps/web/public/images/brands/
- Verify Supabase retailers table has all 10 brands
- Ensure auth callback route works
- Test inventory service health endpoint

## File Structure
```
apps/web/src/
├── app/
│   ├── page.tsx              (landing page - imports all sections)
│   ├── globals.css           (new design system variables + base styles)
│   └── layout.tsx            (Outfit font, metadata)
├── components/
│   ├── landing/
│   │   ├── FloatingNav.tsx
│   │   ├── HeroSection.tsx
│   │   ├── BrandMarquee.tsx
│   │   ├── PhoneDemo.tsx
│   │   ├── FeatureSection.tsx
│   │   ├── BenefitsGrid.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── ClosingCTA.tsx
│   │   └── Footer.tsx
│   └── ui/
│       ├── ScrollReveal.tsx
│       └── GlowCard.tsx
```
