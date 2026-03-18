'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

/* ─── Cloud SVG component ─── */
function CloudSVG() {
  return (
    <svg
      width="300"
      height="180"
      viewBox="0 0 300 180"
      fill="none"
      style={{ display: 'block' }}
    >
      <ellipse cx="150" cy="110" rx="130" ry="50" fill="white" opacity="0.5" />
      <ellipse cx="100" cy="80" rx="80" ry="60" fill="white" opacity="0.5" />
      <ellipse cx="200" cy="75" rx="70" ry="55" fill="white" opacity="0.5" />
      <ellipse cx="150" cy="60" rx="60" ry="45" fill="white" opacity="0.5" />
    </svg>
  );
}

/* ─── Arrow icon ─── */
function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ marginLeft: 8 }}
    >
      <path
        d="M4 9h10M10 5l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ClosingCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftCloudRef = useRef<HTMLDivElement>(null);
  const rightCloudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const leftCloud = leftCloudRef.current;
    const rightCloud = rightCloudRef.current;
    if (!section || !leftCloud || !rightCloud) return;

    function onScroll() {
      const rect = section!.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, 1 - rect.top / window.innerHeight)
      );
      const drift = progress * 100;
      leftCloud!.style.transform = `translateY(-50%) translateX(${drift}px)`;
      rightCloud!.style.transform = `translateY(-50%) translateX(${-drift}px)`;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="closing"
      style={{
        background: 'var(--bg-sky, #E8EFF7)',
        padding: '140px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left cloud */}
      <div
        ref={leftCloudRef}
        style={{
          position: 'absolute',
          left: -100,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <CloudSVG />
      </div>

      {/* Right cloud */}
      <div
        ref={rightCloudRef}
        style={{
          position: 'absolute',
          right: -100,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <CloudSVG />
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 600,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(30px, 5vw, 48px)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--text-primary, #1A1A1A)',
            margin: '0 0 20px',
          }}
        >
          Ready to start saving
        </h2>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: 'var(--text-body, #6B6B6B)',
            margin: '0 0 36px',
          }}
        >
          Browse gift cards for free. No credit card required.
        </p>
        <Link
          href="/signup"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--dark, #1A1A1A)',
            color: '#fff',
            padding: '16px 36px',
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = 'var(--dark-hover, #333)';
            el.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = 'var(--dark, #1A1A1A)';
            el.style.transform = 'translateY(0)';
          }}
        >
          Get started for free
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
