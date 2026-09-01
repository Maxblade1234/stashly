# Stashly (Gift Hauls) - Wallet Version Design System
# Design Reference: Wallet Framer Template (wallettemplate.framer.website)

## Brand Identity
Stashly is a premium gift card marketplace. This version uses a bold, app-forward aesthetic inspired by fintech wallet apps. The design alternates between warm light sections and dramatic dark sections, with a vibrant orange-red accent and rich interactive effects including 3D card parallax, scroll-triggered animations, and sticky scrolling.

---

## Typography

**Primary Font:** Outfit (Google Fonts) - weights 300, 400, 500, 600, 700

**Hierarchy (Desktop):**
- Hero headline: 72-80px, weight 500, letter-spacing -0.03em, line-height 1.05, centered
- Section headline (dark bg): 44-52px, weight 400 (lighter feel), line-height 1.15, left-aligned or centered
- Section headline (light bg): 44-52px, weight 500, letter-spacing -0.02em, centered
- Sub-headline / body large: 18-20px, weight 400, line-height 1.6, color muted
- Feature card title: 22-26px, weight 500
- Caption/label: 14px, weight 400, muted gray
- Nav links: 15px, weight 400

**Hierarchy (Mobile):**
- Hero: 40-48px
- Section: 32-38px
- Body: 16px minimum

**Rules:**
- Hero text on light backgrounds: near-black (#1A1A1A)
- Hero text on dark backgrounds: white (#FFFFFF)
- Body text is always muted: #7A7A7A on light, #999999 on dark
- The template uses a clean geometric sans. Outfit at weight 400-500 matches this perfectly.

---

## Color Palette

```css
:root {
  /* Light backgrounds */
  --color-bg-warm:         #FDF5EF;    /* warm peach-cream, hero background */
  --color-bg-warm-glow:    radial-gradient(ellipse at center, rgba(255,140,100,0.15) 0%, transparent 60%);
  --color-bg-light:        #F5F0EA;    /* light warm gray for secondary sections */
  --color-bg-sage:         #EEF2EA;    /* light sage/mint for security section */
  --color-surface:         #FFFFFF;

  /* Dark backgrounds */
  --color-dark:            #0D0D0D;    /* primary dark sections */
  --color-dark-surface:    #1A1A1A;    /* cards on dark backgrounds */
  --color-dark-border:     rgba(255,255,255,0.08);  /* subtle card borders on dark */

  /* Text */
  --color-text-primary:    #1A1A1A;
  --color-text-body:       #7A7A7A;    /* muted gray for descriptions */
  --color-text-on-dark:    #FFFFFF;
  --color-text-on-dark-muted: #999999;

  /* Accent - Wallet's signature orange-red */
  --color-accent:          #E84D1A;    /* vibrant orange-red for primary CTAs */
  --color-accent-hover:    #D44316;
  --color-accent-glow:     rgba(232, 77, 26, 0.3);  /* glow effect behind buttons */
  --color-accent-text:     #FFFFFF;

  /* Gift card specific */
  --color-savings:         #2D7A2F;
  --color-savings-bg:      #E8F5E9;

  /* Utility */
  --color-border:          #E8E3DB;
  --color-error:           #D32F2F;
}
```

**Rules:**
- The hero section uses --color-bg-warm with a subtle radial glow (pink-orange) behind the phone mockup
- Dark sections use true black (#0D0D0D), not dark gray
- Cards on dark backgrounds have very subtle borders (rgba white at 8%) and slightly lighter surfaces (#1A1A1A)
- The orange-red accent is ONLY for primary CTA buttons. It should feel like a "hot" action color.
- Never use orange-red for backgrounds or decorative elements

---

## Navigation

```css
.nav {
  position: sticky;
  top: 16px;
  z-index: 100;
  width: fit-content;
  margin: 0 auto;
  background: rgba(13, 13, 13, 0.9);
  backdrop-filter: blur(12px);
  padding: 12px 20px;
  border-radius: 999px;          /* floating pill nav */
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-logo { color: var(--color-accent); }  /* orange icon */
.nav-link { color: rgba(255,255,255,0.7); font-size: 15px; }
.nav-link:hover { color: white; }
.nav-cta {
  background: var(--color-accent);
  color: white;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}
```

The nav is a **floating centered pill**, not full-width. It hovers above content with a dark translucent background. This is one of Wallet's most distinctive design elements.

---

## Buttons

```css
/* Primary CTA - Orange-red with glow */
.btn-primary {
  background: var(--color-accent);
  color: white;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  box-shadow: 0 4px 24px var(--color-accent-glow);
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 6px 32px rgba(232, 77, 26, 0.4);
  transform: translateY(-2px);
}

/* Secondary CTA - Dark pill for dark sections */
.btn-secondary {
  background: rgba(255,255,255,0.1);
  color: white;
  padding: 14px 28px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.15);
  font-size: 15px;
  font-weight: 500;
  backdrop-filter: blur(8px);
}

/* Tertiary - Dark solid for light backgrounds */
.btn-tertiary {
  background: var(--color-dark);
  color: white;
  padding: 14px 28px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
}
```

---

## Effects & Animations (THE CORE OF THIS DESIGN)

### 1. Hero Phone Mockup with Floating Bubbles
The hero features a centered iPhone mockup. As the user scrolls, transaction "bubble" elements float outward from behind the phone. For Stashly, these become gift card transaction notifications ("$25 Starbucks card delivered", "$50 Amazon - 8% off", etc.)

```css
.hero-bubble {
  position: absolute;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 16px;
  opacity: 0;
  transform: translateY(20px) scale(0.9);
  transition: opacity 0.6s ease, transform 0.6s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.hero-bubble.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}
/* Stagger the bubbles */
.hero-bubble:nth-child(1) { transition-delay: 0.1s; }
.hero-bubble:nth-child(2) { transition-delay: 0.3s; }
.hero-bubble:nth-child(3) { transition-delay: 0.5s; }
```

### 2. 3D Gift Card Parallax (THREE.JS - THE SHOWSTOPPER)
The template's 3D card fan section is where colorful brand cards rotate to follow the mouse cursor. For Stashly, these become real gift card brands: Amazon, Starbucks, Uber Eats, Target, Nike, etc.

**Implementation: Use Three.js 3D Viewer**
- Cards arranged in a fanned arc layout (like a hand of playing cards)
- Each card has a colorful gradient or brand imagery
- Mouse movement rotates the entire card group to face the cursor
- Cards have slight parallax depth (front cards move more than back)
- Smooth easing on rotation (lerp, not instant snap)
- Light background with subtle ethereal glow behind cards

```javascript
// Pseudocode for Three.js implementation
// Cards in a fan layout, each with perspective transform
// On mousemove: calculate rotation angles, lerp toward target
// Each card: slightly different rotation offset for depth
const targetRotX = (mouseY / windowH - 0.5) * 15; // degrees
const targetRotY = (mouseX / windowW - 0.5) * 25; // degrees
// Lerp: currentRot += (targetRot - currentRot) * 0.08;
```

### 3. Scroll-Triggered Fade-Up Reveals
```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1),
              transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 4. Sticky Scrolling Sections
Dark feature sections use sticky positioning so content overlaps and reveals as you scroll through.

### 5. Animated Starfield (Closing CTA)
The closing dark section has animated shooting stars / meteors across a dark sky. Implement with CSS keyframes or canvas.

```css
.shooting-star {
  position: absolute;
  width: 100px;
  height: 1px;
  background: linear-gradient(to right, rgba(255,255,255,0.6), transparent);
  animation: shoot 3s linear infinite;
  transform: rotate(-35deg);
}
@keyframes shoot {
  0% { transform: translateX(-200px) translateY(-200px) rotate(-35deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateX(800px) translateY(800px) rotate(-35deg); opacity: 0; }
}
```

### 6. Smooth Scrolling
Enable native smooth scrolling site-wide:
```css
html { scroll-behavior: smooth; }
```

---

## Section-by-Section Layout

### 1. Hero (Warm Light Background)
- Background: --color-bg-warm with subtle radial pink-orange glow
- Floating pill nav at top center
- Large centered headline: "Reimagine How You Save on Gift Cards"
- Centered iPhone mockup showing a gift card wallet/swap UI
- Floating transaction bubbles animating outward on scroll
- Below phone: description text + orange-red CTA button
- "Also available on" row with platform icons/badges

### 2. Feature Intro (Dark Full-Bleed)
- Background: --color-dark
- Split layout: large white headline left, muted description + CTA right
- Below: two-column feature card grid
  - Left card: lifestyle photo with overlaid customer quote
  - Right card: product screenshot/mockup with feature description
- Cards have dark surfaces (#1A1A1A) with subtle borders and rounded corners (20px)

### 3. 3D Gift Card Showcase (Light Background - THE HERO EFFECT)
- Background: light with subtle ethereal/nature texture
- Centered headline with partial orange text highlight
- **Three.js 3D card fan**: 5-7 popular gift card brands arranged in arc
- Cards rotate to follow mouse position
- Below: centered description in monospace or clean serif
- Use Google image generation for gift card brand visuals if needed

### 4. Security / Trust (Light Sage Background)
- Background: --color-bg-sage
- Split layout: headline + feature pills (left), dark card with trust UI mockup (right)
- Feature pills: icon + label in light rounded rectangles
  - "Verified Cards", "Instant Delivery", "Money-Back Guarantee"
- The dark card shows a simulated secure checkout or verification UI

### 5. Partner Brand Integration (Light Background)
- Centered headline
- 3 colorful brand cards in a row (tilted/3D perspective)
- Cards show gift card brand logos with colorful gradient backgrounds
- Below: centered description text

### 6. Closing CTA (Dark with Starfield)
- Background: --color-dark with animated shooting stars
- Aurora/golden glow at bottom
- Centered white headline: "Experience savings like never before with Stashly"
- Orange-red CTA button
- "Also available on" platform badges below

### 7. Footer (Light)
- Standard two-column footer
- Logo + description left, navigation links right

---

## Spacing

Same 8px grid as before. Wallet uses extremely generous spacing between sections.

- Between major sections: 140-180px (desktop), 80-100px (mobile)
- Section headline to content: 48-64px
- Container max-width: 1200px
- Side padding: 32px desktop, 20px mobile

---

## ANTI-PATTERNS

1. No flat, generic card designs. Cards must have depth (borders, shadows, or dark surface contrast).
2. No blue or purple accents. The accent is orange-red ONLY.
3. No stock photos of smiling people. Use product imagery, brand cards, or lifestyle shots similar to Wallet's aesthetic.
4. No pill-shaped primary CTAs. Wallet uses rounded rectangles (12px radius) for primary CTAs, pills only for nav and secondary.
5. No visible grid lines or table borders in data displays.
6. No placeholder content.
7. Body text is NEVER full black on any background.
8. Do not skip the 3D card section. This is the signature effect.
9. The floating pill nav must be centered, not full-width.
10. Dark sections must be true black (#0D0D0D), not dark gray.
