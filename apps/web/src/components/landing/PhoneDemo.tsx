'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

/* ────────────────────────────────────────────────
   Card data
   ──────────────────────────────────────────────── */
interface CardItem {
  name: string;
  discount: string;
  image?: string;          // path under /images/brands/
  color?: string;          // fallback circle color
  letter?: string;         // first letter for circle
}

const CARDS: CardItem[] = [
  { name: 'Apple',       discount: '-8.5%',  image: '/images/brands/apple.png' },
  { name: 'Chipotle',    discount: '-12%',   image: '/images/brands/chipotle.png' },
  { name: "Domino's",    discount: '-15%',   image: '/images/brands/dominos.png' },
  { name: 'eBay',        discount: '-9.8%',  image: '/images/brands/ebay.png' },
  { name: 'Microsoft',   discount: '-6.2%',  image: '/images/brands/microsoft.png' },
  { name: 'Starbucks',   discount: '-14%',   color: '#00704A', letter: 'S' },
  { name: 'Target',      discount: '-5%',    color: '#CC0000', letter: 'T' },
  { name: 'Nike',        discount: '-10%',   color: '#111111', letter: 'N' },
  { name: 'Uber Eats',   discount: '-8%',    color: '#06C167', letter: 'U' },
];

const CATEGORIES = ['All', 'Dining', 'Retail', 'Gaming', 'Travel'];

/* ────────────────────────────────────────────────
   SVG helpers
   ──────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#999" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const StatusBar = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 20px 4px', fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
    <span>9:41</span>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {/* Signal */}
      <svg width="16" height="12" viewBox="0 0 16 12" fill="#1A1A1A">
        <rect x="0" y="8" width="3" height="4" rx="0.5" />
        <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
        <rect x="9" y="2" width="3" height="10" rx="0.5" />
        <rect x="13" y="0" width="3" height="12" rx="0.5" />
      </svg>
      {/* WiFi */}
      <svg width="14" height="12" viewBox="0 0 24 20" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round">
        <path d="M1 7c5.5-5.5 16.5-5.5 22 0" />
        <path d="M5 11c3.5-3.5 10.5-3.5 14 0" />
        <path d="M9 15c1.5-1.5 4.5-1.5 6 0" />
        <circle cx="12" cy="18" r="1" fill="#1A1A1A" stroke="none" />
      </svg>
      {/* Battery */}
      <svg width="24" height="12" viewBox="0 0 28 13" fill="#1A1A1A">
        <rect x="0" y="0.5" width="23" height="12" rx="2.5" stroke="#1A1A1A" strokeWidth="1" fill="none" />
        <rect x="2" y="2.5" width="19" height="8" rx="1" />
        <path d="M25 4.5v4a1.5 1.5 0 000-4z" />
      </svg>
    </div>
  </div>
);

/* ────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────── */
export default function PhoneDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /* Direct DOM refs for layers */
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const cardListRef = useRef<HTMLDivElement>(null);
  const dominosCardRef = useRef<HTMLDivElement>(null);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const checkCircleRef = useRef<SVGCircleElement>(null);
  const checkMarkRef = useRef<SVGPolylineElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);

  /* Mutable state for scroll logic — no re-renders */
  const stateRef = useRef({
    browseLocked: false,
    browseProgress: 0,
    browseOverflow: 0,
    browseCompleted: false,
    browseLockY: 0,
    touchStartY: 0,
    lastRenderedPhase: -1,
  });

  /* Only for progress dots visual */
  const [activePhase, setActivePhase] = useState(0);

  /* ── Render frame from progress ─────────────── */
  const renderFrame = useCallback((progress: number) => {
    const l1 = layer1Ref.current;
    const l2 = layer2Ref.current;
    const l3 = layer3Ref.current;
    const cl = cardListRef.current;
    const dc = dominosCardRef.current;
    const atc = addToCartRef.current;
    const cc = checkCircleRef.current;
    const cm = checkMarkRef.current;
    const conf = confettiRef.current;
    if (!l1 || !l2 || !l3 || !cl || !dc || !atc || !cc || !cm || !conf) return;

    /*
     * Progress ranges WITH pauses:
     * 0.00–0.18  Phase 1: scroll card list
     * 0.18–0.24  PAUSE (hold after scroll)
     * 0.24–0.34  Phase 2: highlight Domino's
     * 0.34–0.40  PAUSE (hold after highlight)
     * 0.40–0.52  Phase 3: slide to detail screen
     * 0.52–0.58  PAUSE (view detail screen)
     * 0.58–0.64  Phase 3b: tap Add to Cart
     * 0.64–0.70  PAUSE (hold after tap)
     * 0.70–0.82  Phase 4: slide to confirmation + checkmark
     * 0.82–0.88  PAUSE (view confirmation)
     * 0.88–1.00  Phase 5: confetti
     */

    let phase: number;
    if (progress < 0.24) phase = 0;
    else if (progress < 0.40) phase = 1;
    else if (progress < 0.70) phase = 2;
    else if (progress < 0.88) phase = 3;
    else phase = 4;

    /* Phase 1: 0–0.18 — scroll card list (pause 0.18–0.24) */
    const scrollP = Math.min(progress / 0.18, 1);
    cl.style.transform = `translateY(-${scrollP * 80}px)`;

    /* Phase 2: 0.24–0.34 — highlight Domino's (pause 0.34–0.40) */
    const highlightP = progress < 0.24 ? 0 : progress < 0.34 ? (progress - 0.24) / 0.10 : progress < 0.40 ? 1 : 1;
    if (highlightP > 0.3) {
      dc.style.background = '#EFF7EF';
      dc.style.border = '2px solid var(--green)';
      dc.style.boxShadow = '0 0 12px rgba(45,122,47,0.15)';
      dc.style.transform = 'scale(1.02)';
    } else {
      dc.style.background = '#F9F9F9';
      dc.style.border = '2px solid transparent';
      dc.style.boxShadow = 'none';
      dc.style.transform = 'scale(1)';
    }

    /* Phase 3: 0.40–0.52 — slide list out, detail in (pause 0.52–0.58) */
    const slideP = progress < 0.40 ? 0 : progress < 0.52 ? (progress - 0.40) / 0.12 : 1;
    if (progress >= 0.40) {
      l1.style.transform = `translateX(-${slideP * 100}%)`;
      l1.style.opacity = `${1 - slideP}`;
      l2.style.transform = `translateX(${(1 - slideP) * 100}%)`;
      l2.style.opacity = `${slideP}`;
    } else {
      l1.style.transform = 'translateX(0)';
      l1.style.opacity = '1';
      l2.style.transform = 'translateX(100%)';
      l2.style.opacity = '0';
    }

    /* Phase 3b: 0.58–0.64 — tap Add to Cart (pause 0.64–0.70) */
    if (progress >= 0.58) {
      atc.style.background = '#333';
      atc.style.transform = 'scale(0.97)';
    } else {
      atc.style.background = 'var(--dark)';
      atc.style.transform = 'scale(1)';
    }

    /* Phase 4: 0.70–0.82 — slide detail out, confirm in + checkmark (pause 0.82–0.88) */
    const confirmP = progress < 0.70 ? 0 : progress < 0.82 ? (progress - 0.70) / 0.12 : 1;
    if (progress >= 0.70) {
      l2.style.transform = `translateX(-${confirmP * 100}%)`;
      l2.style.opacity = `${1 - confirmP}`;
      l3.style.transform = `translateX(${(1 - confirmP) * 100}%)`;
      l3.style.opacity = `${confirmP}`;
    } else {
      l3.style.transform = 'translateX(100%)';
      l3.style.opacity = '0';
    }

    /* Animate checkmark */
    const circleProgress = Math.min(confirmP * 2, 1);
    const checkProgress = Math.max((confirmP - 0.5) * 2, 0);
    cc.style.strokeDashoffset = `${226 * (1 - circleProgress)}`;
    cm.style.strokeDashoffset = `${36 * (1 - checkProgress)}`;

    /* Phase 5: 0.88–1.0 — confetti */
    if (progress >= 0.88 && stateRef.current.lastRenderedPhase < 4) {
      conf.style.display = 'block';
      conf.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions
      conf.querySelectorAll<HTMLElement>('.confetti-dot, .confetti-star').forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions
        el.style.animation = '';
      });
    } else if (progress < 0.88) {
      conf.style.display = 'none';
    }

    /* Update phase dots (only triggers setState when phase changes) */
    if (phase !== stateRef.current.lastRenderedPhase) {
      stateRef.current.lastRenderedPhase = phase;
      setActivePhase(phase);
    }
  }, []);

  /* ── Reset all layers ───────────────────────── */
  const resetLayers = useCallback(() => {
    stateRef.current.browseProgress = 0;
    stateRef.current.browseOverflow = 0;
    stateRef.current.browseCompleted = false;
    stateRef.current.browseLocked = false;
    stateRef.current.lastRenderedPhase = -1;
    renderFrame(0);
  }, [renderFrame]);

  /* ── Scroll hijack ──────────────────────────── */
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const SCROLL_SENSITIVITY = 0.0005;
    const TOUCH_SENSITIVITY = 0.0012;
    const WHEEL_OVERFLOW_THRESHOLD = 800;
    const TOUCH_OVERFLOW_THRESHOLD = 250;
    const s = stateRef.current;

    function isBrowseNearTop(): boolean {
      const rect = container!.getBoundingClientRect();
      return rect.top <= 20 && rect.top >= -100 && rect.bottom > window.innerHeight * 0.3;
    }

    function onWheel(e: WheelEvent) {
      const near = isBrowseNearTop();

      /* Engage lock */
      if (!s.browseLocked && near && e.deltaY > 0 && !s.browseCompleted) {
        s.browseLocked = true;
        s.browseOverflow = 0;
        s.browseLockY = window.scrollY;
      }

      /* Re-engage when scrolling back up into incomplete animation */
      if (!s.browseLocked && near && e.deltaY < 0 && s.browseProgress > 0.001 && !s.browseCompleted) {
        s.browseLocked = true;
        s.browseOverflow = 0;
      }

      if (!s.browseLocked) return;

      e.preventDefault();

      const delta = e.deltaY * SCROLL_SENSITIVITY;
      s.browseProgress = Math.max(0, Math.min(1, s.browseProgress + delta));

      renderFrame(s.browseProgress);

      /* Keep page position locked */
      window.scrollTo({ top: s.browseLockY });

      /* Overflow at boundaries to release */
      if (s.browseProgress >= 0.999) {
        s.browseOverflow += Math.abs(e.deltaY);
        if (s.browseOverflow > WHEEL_OVERFLOW_THRESHOLD) {
          s.browseLocked = false;
          s.browseCompleted = true;
        }
      } else if (s.browseProgress <= 0.001) {
        s.browseOverflow += Math.abs(e.deltaY);
        if (s.browseOverflow > WHEEL_OVERFLOW_THRESHOLD) {
          s.browseLocked = false;
        }
      } else {
        s.browseOverflow = 0;
      }
    }

    function onTouchStart(e: TouchEvent) {
      s.touchStartY = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      const dy = s.touchStartY - e.touches[0].clientY;
      s.touchStartY = e.touches[0].clientY;
      const near = isBrowseNearTop();

      if (!s.browseLocked && near && dy > 0 && !s.browseCompleted) {
        s.browseLocked = true;
        s.browseOverflow = 0;
        s.browseLockY = window.scrollY;
      }

      if (!s.browseLocked && near && dy < 0 && s.browseProgress > 0.001 && !s.browseCompleted) {
        s.browseLocked = true;
        s.browseOverflow = 0;
      }

      if (!s.browseLocked) return;

      e.preventDefault();

      const delta = dy * TOUCH_SENSITIVITY;
      s.browseProgress = Math.max(0, Math.min(1, s.browseProgress + delta));

      renderFrame(s.browseProgress);
      window.scrollTo({ top: s.browseLockY });

      if (s.browseProgress >= 0.999) {
        s.browseOverflow += Math.abs(dy);
        if (s.browseOverflow > TOUCH_OVERFLOW_THRESHOLD) {
          s.browseLocked = false;
          s.browseCompleted = true;
        }
      } else if (s.browseProgress <= 0.001) {
        s.browseOverflow += Math.abs(dy);
        if (s.browseOverflow > TOUCH_OVERFLOW_THRESHOLD) {
          s.browseLocked = false;
        }
      } else {
        s.browseOverflow = 0;
      }
    }

    /* Reset when section leaves viewport entirely */
    function onScroll() {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight + 200) {
        resetLayers();
      }
    }

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, [renderFrame, resetLayers]);

  /* ── Confetti data ──────────────────────────── */
  const confettiDots = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const dist = 60 + Math.random() * 60;
    const cx = Math.cos((angle * Math.PI) / 180) * dist;
    const cy = Math.sin((angle * Math.PI) / 180) * dist;
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F97316', '#34D399', '#60A5FA', '#FB7185'];
    return { cx, cy, color: colors[i % colors.length], delay: Math.random() * 0.3 };
  });

  const confettiStars = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 360;
    const dist = 40 + Math.random() * 50;
    const cx = Math.cos((angle * Math.PI) / 180) * dist;
    const cy = Math.sin((angle * Math.PI) / 180) * dist;
    return { cx, cy, delay: Math.random() * 0.2 };
  });

  /* ── Layer transition base style ────────────── */
  const layerBase: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    willChange: 'transform, opacity',
  };

  /* ── Render ─────────────────────────────────── */
  return (
    <section
      ref={sectionRef}
      style={{ background: 'var(--bg-light)', padding: '140px 0 0', position: 'relative', overflow: 'hidden' }}
    >
      {/* Section header */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <p style={{
          fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16,
        }}>
          Gift Card Marketplace
        </p>
        <h2 style={{
          fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 500, letterSpacing: '-0.02em',
          lineHeight: 1.1, textAlign: 'center', color: 'var(--text-primary)',
        }}>
          Browse thousands of gift cards,
          <br />all in one place
        </h2>
        <p style={{
          fontSize: 18, color: 'var(--text-body)', lineHeight: 1.65,
          maxWidth: 600, margin: '20px auto 0', textAlign: 'center',
        }}>
          From dining to gaming to retail — find discounted gift cards from your favorite brands and save every time you shop.
        </p>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        style={{
          height: '100vh', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Progress dots */}
        <div style={{
          position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10,
        }}
          className="hidden md:flex"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              ref={el => { dotsRef.current[i] = el; }}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: activePhase === i ? 'var(--dark)' : 'var(--border)',
                transform: activePhase === i ? 'scale(1.4)' : 'scale(1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Phone mockup */}
        <div style={{
          width: 320, minHeight: 680,
          background: '#fff', borderRadius: 48,
          border: '10px solid #1A1A1A',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          position: 'relative',
        }}>
          {/* Notch */}
          <div style={{
            width: 100, height: 30, background: '#1A1A1A',
            borderRadius: 20, margin: '4px auto 0',
          }} />

          {/* Status bar */}
          <StatusBar />

          {/* Content area — 3 layers */}
          <div style={{ position: 'relative', minHeight: 560, overflow: 'hidden' }}>
            {/* ─── Layer 1: Card list ─── */}
            <div ref={layer1Ref} style={{ ...layerBase }}>
              <div style={{ padding: '8px 16px 0' }}>
                {/* Search bar */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#F5F5F5', borderRadius: 10, padding: '10px 14px',
                  marginBottom: 12,
                }}>
                  <SearchIcon />
                  <span style={{ fontSize: 14, color: '#999' }}>Search gift cards...</span>
                </div>

                {/* Category pills */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }}>
                  {CATEGORIES.map((cat, i) => (
                    <div key={cat} style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                      whiteSpace: 'nowrap' as const,
                      background: i === 0 ? 'var(--dark)' : '#F0F0F0',
                      color: i === 0 ? '#fff' : 'var(--text-body)',
                    }}>
                      {cat}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable card list */}
              <div style={{ height: 420, overflow: 'hidden', padding: '0 16px' }}>
                <div ref={cardListRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {CARDS.map((card, idx) => (
                    <div
                      key={card.name}
                      ref={card.name === "Domino's" ? dominosCardRef : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: 14, background: '#F9F9F9', borderRadius: 14,
                        border: '2px solid transparent',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {/* Icon */}
                      {card.image ? (
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: '#fff', border: '1px solid #eee',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, overflow: 'hidden', padding: 4,
                        }}>
                          <Image
                            src={card.image}
                            alt={card.name}
                            width={36}
                            height={36}
                            style={{ objectFit: 'contain', ...(card.name === 'Chipotle' ? { transform: 'scale(1.5)' } : {}) }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: card.color, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 18, fontWeight: 600,
                        }}>
                          {card.letter}
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {card.name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-light)' }}>Gift Card</div>
                      </div>

                      {/* Discount */}
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--green)',
                        flexShrink: 0,
                      }}>
                        {card.discount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Layer 2: Detail screen ─── */}
            <div ref={layer2Ref} style={{ ...layerBase, transform: 'translateX(100%)', opacity: 0 }}>
              <div style={{ padding: '8px 16px 0' }}>
                {/* Back button */}
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 14, color: 'var(--text-body)', marginBottom: 20,
                  padding: 0, background: 'none', border: 'none',
                }}>
                  <ChevronLeft /> Back
                </button>

                {/* Brand header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: '#fff', border: '1px solid #eee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12, overflow: 'hidden', padding: 6,
                  }}>
                    <Image
                      src="/images/brands/dominos.png"
                      alt="Domino's"
                      width={52}
                      height={52}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Domino&apos;s</div>
                  <div style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 2 }}>Gift Card</div>
                </div>

                {/* Pricing box */}
                <div style={{
                  background: '#F9F9F9', borderRadius: 14, padding: 20,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-body)' }}>Card Value</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>$25.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-body)' }}>Retail Price</span>
                    <span style={{ fontSize: 14, color: 'var(--text-light)', textDecoration: 'line-through' }}>$25.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-body)' }}>Your Price</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>$21.25</span>
                  </div>
                  <div style={{
                    marginTop: 12, paddingTop: 12,
                    borderTop: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 14, color: 'var(--text-body)' }}>You Save</span>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--green)',
                      background: 'var(--green-bg)', padding: '4px 10px', borderRadius: 6,
                    }}>
                      15% off &mdash; $3.75
                    </span>
                  </div>
                </div>

                {/* Quantity */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 20, marginBottom: 24,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: 'var(--text-body)',
                  }}>-</div>
                  <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>1</span>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: 'var(--text-body)',
                  }}>+</div>
                </div>

                {/* Add to Cart */}
                <div
                  ref={addToCartRef}
                  style={{
                    background: 'var(--dark)', color: '#fff',
                    padding: '14px 0', borderRadius: 999, textAlign: 'center',
                    fontSize: 15, fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Add to Cart — $21.25
                </div>
              </div>
            </div>

            {/* ─── Layer 3: Confirmation ─── */}
            <div ref={layer3Ref} style={{ ...layerBase, transform: 'translateX(100%)', opacity: 0 }}>
              <div style={{ padding: '20px 16px 0', textAlign: 'center' }}>
                {/* Animated checkmark */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                  <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
                    <circle
                      ref={checkCircleRef}
                      cx="40" cy="40" r="36"
                      stroke="var(--green)" strokeWidth="3"
                      strokeDasharray="226"
                      strokeDashoffset="226"
                      fill="none"
                      style={{ animation: 'drawCircle 0.6s ease forwards' }}
                    />
                    <polyline
                      ref={checkMarkRef}
                      points="26,42 36,52 56,30"
                      stroke="var(--green)" strokeWidth="3.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      fill="none"
                      strokeDasharray="36"
                      strokeDashoffset="36"
                      style={{ animation: 'drawCheck 0.4s ease 0.5s forwards' }}
                    />
                  </svg>

                  {/* Confetti container */}
                  <div
                    ref={confettiRef}
                    style={{
                      position: 'absolute', top: '50%', left: '50%',
                      width: 0, height: 0, display: 'none',
                    }}
                  >
                    {confettiDots.map((d, i) => (
                      <div
                        key={`dot-${i}`}
                        className="confetti-dot"
                        style={{
                          position: 'absolute', width: 6, height: 6, borderRadius: '50%',
                          background: d.color,
                          '--cx': `${d.cx}px`, '--cy': `${d.cy}px`,
                          animation: `confettiBurst 0.8s ease-out ${d.delay}s forwards`,
                        } as React.CSSProperties}
                      />
                    ))}
                    {confettiStars.map((s, i) => (
                      <div
                        key={`star-${i}`}
                        className="confetti-star"
                        style={{
                          position: 'absolute', fontSize: 12,
                          '--cx': `${s.cx}px`, '--cy': `${s.cy}px`,
                          animation: `starBurst 0.8s ease-out ${s.delay}s forwards`,
                        } as React.CSSProperties}
                      >
                        &#9733;
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Order Confirmed!
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-body)', marginBottom: 4 }}>
                  Domino&apos;s $25 Gift Card
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', marginBottom: 24 }}>
                  You saved $3.75
                </div>

                {/* Detail box */}
                <div style={{
                  background: '#F9F9F9', borderRadius: 14, padding: 20,
                  textAlign: 'left', marginBottom: 24,
                }}>
                  {[
                    ['Card Value', '$25.00'],
                    ['Amount Paid', '$21.25'],
                    ['Discount', '15%'],
                    ['Delivery', 'Instant (Email)'],
                  ].map(([label, value], i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: i < 3 ? '1px solid #eee' : 'none',
                    }}>
                      <span style={{ fontSize: 14, color: 'var(--text-body)' }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Done button */}
                <div style={{
                  background: 'var(--green)', color: '#fff',
                  padding: '14px 0', borderRadius: 999, textAlign: 'center',
                  fontSize: 15, fontWeight: 500,
                }}>
                  Done
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
