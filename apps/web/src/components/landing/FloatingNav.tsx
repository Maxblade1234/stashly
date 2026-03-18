'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Reviews', href: '#testimonials' },
] as const;

export default function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 100);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        paddingTop: 16,
        pointerEvents: 'none' as const,
      }}
    >
      <nav
        style={{
          pointerEvents: 'all',
          width: 'fit-content',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          padding: '12px 12px 12px 24px',
          borderRadius: 999,
          background: scrolled ? 'rgba(255,255,255,0.72)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          border: scrolled
            ? '1px solid rgba(255,255,255,0.5)'
            : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 16px rgba(0,0,0,0.06)' : 'none',
          transition:
            'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        {/* Logo */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Image
            src="/images/stashly-icon.png"
            alt="Stashly"
            width={28}
            height={28}
            style={{ width: 28, height: 28 }}
            priority
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Stashly
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div
          className="nav-links-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontSize: 15,
                fontWeight: 400,
                color: 'var(--text-body)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  'var(--text-body)';
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <a
          href="#get-started"
          className="nav-cta-btn"
          style={{
            background: 'var(--dark)',
            color: '#fff',
            padding: '10px 22px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background 0.2s ease, transform 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = '#333';
            el.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = 'var(--dark)';
            el.style.transform = 'translateY(0)';
          }}
        >
          Get started
        </a>

        {/* Mobile Hamburger */}
        <button
          className="nav-hamburger"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            display: 'none',
            width: 36,
            height: 36,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg
            width="20"
            height="14"
            viewBox="0 0 20 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1h18M1 7h18M1 13h18"
              stroke="var(--text-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div
          className="nav-mobile-dropdown"
          style={{
            pointerEvents: 'all',
            margin: '8px auto 0',
            width: 'calc(100% - 32px)',
            maxWidth: 360,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 16,
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: 16,
                fontWeight: 400,
                color: 'var(--text-body)',
                textDecoration: 'none',
                padding: '4px 0',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Responsive styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .nav-links-desktop {
            display: none !important;
          }
          .nav-cta-btn {
            display: none !important;
          }
          .nav-hamburger {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
