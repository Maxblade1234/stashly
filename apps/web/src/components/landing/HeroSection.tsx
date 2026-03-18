'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ─── Cloud CSS (pseudo-elements can't be done inline) ─── */
const cloudStyles = `
.hero-cloud {
  position: absolute;
  border-radius: 200px;
  background: rgba(255,255,255,0.5);
  pointer-events: none;
}
.hero-cloud::before,
.hero-cloud::after {
  content: '';
  position: absolute;
  border-radius: 200px;
  background: rgba(255,255,255,0.5);
}

/* Cloud 1 */
.hero-cloud-1 { width:280px; height:80px; top:60px; left:-60px; opacity:0.6; }
.hero-cloud-1::before { width:120px; height:120px; top:-60px; left:50px; }
.hero-cloud-1::after  { width:80px;  height:80px;  top:-40px; left:140px; }

/* Cloud 2 */
.hero-cloud-2 { width:220px; height:60px; top:120px; right:-40px; opacity:0.4; }
.hero-cloud-2::before { width:100px; height:100px; top:-50px; left:30px; }
.hero-cloud-2::after  { width:70px;  height:70px;  top:-35px; left:110px; }

/* Cloud 3 */
.hero-cloud-3 { width:180px; height:50px; top:240px; left:10%; opacity:0.3; }
.hero-cloud-3::before { width:80px; height:80px; top:-40px; left:20px; }
.hero-cloud-3::after  { width:60px; height:60px; top:-30px; left:90px; }

/* Cloud 4 */
.hero-cloud-4 { width:200px; height:55px; top:180px; right:8%; opacity:0.35; }
.hero-cloud-4::before { width:90px; height:90px; top:-45px; left:25px; }
.hero-cloud-4::after  { width:65px; height:65px; top:-32px; left:100px; }

@media (max-width: 768px) {
  .hero-sidebar { display: none !important; }
  .hero-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .hero-hide-mobile { display: none !important; }
}
`;

/* ─── Data ─── */
const STATS = [
  { label: 'Total Savings', value: '$2,847', change: '+12.5%' },
  { label: 'Cards Purchased', value: '156', change: '+8.3%' },
  { label: 'Rewards Points', value: '4,520', change: '+15.2%' },
  { label: 'Average Discount', value: '11.4%', change: '+2.1%' },
] as const;

const ORDERS: {
  brand: string;
  icon: string;
  amount: string;
  discount: string;
  status: 'Delivered' | 'Processing' | 'Pending';
  date: string;
}[] = [
  { brand: 'Apple', icon: '/images/brands/apple.png', amount: '$100.00', discount: '-8.5%', status: 'Delivered', date: 'Mar 15, 2026' },
  { brand: 'Chipotle', icon: '/images/brands/chipotle.png', amount: '$50.00', discount: '-12.0%', status: 'Delivered', date: 'Mar 14, 2026' },
  { brand: 'Microsoft', icon: '/images/brands/microsoft.png', amount: '$200.00', discount: '-6.2%', status: 'Processing', date: 'Mar 14, 2026' },
  { brand: "Domino's", icon: '/images/brands/dominos.png', amount: '$25.00', discount: '-15.0%', status: 'Delivered', date: 'Mar 13, 2026' },
  { brand: 'eBay', icon: '/images/brands/ebay.png', amount: '$75.00', discount: '-9.8%', status: 'Pending', date: 'Mar 12, 2026' },
];

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', active: true, icon: SvgDashboard },
  { label: 'Gift Cards', active: false, icon: SvgGiftCard },
  { label: 'Wishlist', active: false, icon: SvgWishlist },
  { label: 'Rewards', active: false, icon: SvgRewards },
  { label: 'History', active: false, icon: SvgHistory },
  { label: 'Settings', active: false, icon: SvgSettings },
] as const;

const NAV_TABS = ['Overview', 'My Cards', 'Orders', 'Rewards', 'Settings'] as const;

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Delivered: { bg: '#E8F5E9', color: '#2D7A2F' },
  Processing: { bg: '#E3F2FD', color: '#1565C0' },
  Pending: { bg: '#FFF3E0', color: '#E65100' },
};

/* ─── SVG Icons ─── */
function SvgDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function SvgGiftCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8V21" /><path d="M3 12h18" />
      <path d="M12 8c-2-3-6-3-6 0s4 0 6 0" /><path d="M12 8c2-3 6-3 6 0s-4 0-6 0" />
    </svg>
  );
}
function SvgWishlist() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function SvgRewards() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function SvgHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function SvgSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1.08H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
    </svg>
  );
}
function SvgStashlyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#1A1A1A" />
      <text x="8" y="23" fill="#fff" fontSize="18" fontWeight="600" fontFamily="Outfit, sans-serif">S</text>
    </svg>
  );
}

/* ─── Table cell styles ─── */
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 500,
  color: '#9A9A9A',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 12px',
  color: '#6B6B6B',
};

/* ─── Component ─── */
export default function HeroSection() {
  const [flatMockup, setFlatMockup] = useState(false);

  const handleScroll = useCallback(() => {
    setFlatMockup(window.scrollY > 300);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* Intersection-observer reveal */
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.2 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{cloudStyles}</style>

      <section
        style={{
          background: 'var(--bg-sky, #E8EFF7)',
          padding: '80px 0 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Clouds */}
        <div className="hero-cloud hero-cloud-1" />
        <div className="hero-cloud hero-cloud-2" />
        <div className="hero-cloud hero-cloud-3" />
        <div className="hero-cloud hero-cloud-4" />

        {/* Hero Content */}
        <div
          className="reveal"
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 800,
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 500,
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
              fontStyle: 'italic',
              textAlign: 'center',
              color: 'var(--text-primary)',
            }}
          >
            Save on every gift card like a pro
          </h1>

          <p
            style={{
              fontSize: 19,
              maxWidth: 540,
              margin: '24px auto 0',
              textAlign: 'center',
              color: 'var(--text-body)',
              lineHeight: 1.65,
            }}
          >
            Browse thousands of discounted gift cards from the brands you love.
            Pay less, gift more, and watch your savings stack up.
          </p>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              marginTop: 40,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/signup"
              style={{
                background: '#1A1A1A',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 999,
                fontWeight: 500,
                fontSize: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                const t = e.currentTarget;
                t.style.background = '#333';
                t.style.transform = 'translateY(-2px)';
                t.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget;
                t.style.background = '#1A1A1A';
                t.style.transform = 'translateY(0)';
                t.style.boxShadow = 'none';
              }}
            >
              Try Stashly free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <a
              href="#features"
              style={{
                background: 'transparent',
                color: '#1A1A1A',
                padding: '14px 32px',
                borderRadius: 999,
                fontWeight: 500,
                fontSize: 16,
                border: '1.5px solid #E8E3DB',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                const t = e.currentTarget;
                t.style.borderColor = '#1A1A1A';
                t.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget;
                t.style.borderColor = '#E8E3DB';
                t.style.transform = 'translateY(0)';
              }}
            >
              See features
            </a>
          </div>
        </div>

        {/* ─── 3D Dashboard Mockup ─── */}
        <div
          style={{
            perspective: 1200,
            marginTop: 80,
            padding: '0 24px 0',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              transform: flatMockup ? 'rotateX(0deg) scale(1)' : 'rotateX(25deg) scale(0.92)',
              transition: 'transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
              transformOrigin: 'center bottom',
              willChange: 'transform',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid #E8E3DB',
                boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              {/* Dashboard Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 24px',
                  borderBottom: '1px solid #E8E3DB',
                }}
              >
                <Image src="/images/stashly-icon.png" alt="Stashly" width={24} height={24} style={{ borderRadius: 6 }} />
                <span style={{ fontWeight: 600, fontSize: 15, color: '#1A1A1A' }}>
                  Stashly Dashboard
                </span>
                <nav style={{ display: 'flex', gap: 24, marginLeft: 32 }}>
                  {NAV_TABS.map((tab) => (
                    <span
                      key={tab}
                      style={{
                        fontSize: 13,
                        fontWeight: tab === 'Overview' ? 500 : 400,
                        color: tab === 'Overview' ? '#1A1A1A' : '#9A9A9A',
                        cursor: 'default',
                      }}
                    >
                      {tab}
                    </span>
                  ))}
                </nav>
              </div>

              {/* Body */}
              <div style={{ display: 'flex', minHeight: 420 }}>
                {/* Sidebar */}
                <aside className="hero-sidebar" style={{
                  width: 200,
                  borderRight: '1px solid #E8E3DB',
                  padding: '20px 0',
                  flexShrink: 0,
                }}>
                  {SIDEBAR_ITEMS.map(({ label, active, icon: Icon }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 24px',
                        fontSize: 14,
                        fontWeight: active ? 500 : 400,
                        color: active ? '#1A1A1A' : '#9A9A9A',
                        background: active ? '#F5F0E8' : 'transparent',
                        cursor: 'default',
                      }}
                    >
                      <Icon />
                      {label}
                    </div>
                  ))}
                </aside>

                {/* Main content */}
                <div style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
                  {/* Stats Grid */}
                  <div className="hero-stats-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16,
                    marginBottom: 24,
                  }}>
                    {STATS.map(({ label, value, change }) => (
                      <div
                        key={label}
                        style={{
                          background: '#FAFAFA',
                          borderRadius: 12,
                          padding: '18px 20px',
                          border: '1px solid #F0EDE8',
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#9A9A9A', marginBottom: 6 }}>{label}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 22, fontWeight: 600, color: '#1A1A1A' }}>{value}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#2D7A2F' }}>{change}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E8E3DB' }}>
                          <th style={thStyle}>Brand</th>
                          <th style={thStyle}>Amount</th>
                          <th style={thStyle}>Discount</th>
                          <th style={thStyle} className="hero-hide-mobile">Status</th>
                          <th style={thStyle} className="hero-hide-mobile">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ORDERS.map((o) => (
                          <tr key={o.brand} style={{ borderBottom: '1px solid #F0EDE8' }}>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Image
                                  src={o.icon}
                                  alt={o.brand}
                                  width={24}
                                  height={24}
                                  style={{ borderRadius: 6, objectFit: 'contain', ...(o.brand === 'Chipotle' ? { transform: 'scale(1.5)' } : {}) }}
                                />
                                <span style={{ fontWeight: 500, color: '#1A1A1A' }}>{o.brand}</span>
                              </div>
                            </td>
                            <td style={tdStyle}>{o.amount}</td>
                            <td style={{ ...tdStyle, color: '#2D7A2F', fontWeight: 500 }}>{o.discount}</td>
                            <td style={tdStyle} className="hero-hide-mobile">
                              <span
                                style={{
                                  background: STATUS_COLORS[o.status].bg,
                                  color: STATUS_COLORS[o.status].color,
                                  padding: '3px 10px',
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 500,
                                }}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, color: '#9A9A9A' }} className="hero-hide-mobile">{o.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
