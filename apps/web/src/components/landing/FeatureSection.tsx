'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

/* ============================================================
   Types
   ============================================================ */
type Variant = 'order-management' | 'savings-analytics';

interface FeatureSectionProps {
  variant: Variant;
  reversed?: boolean;
}

/* ============================================================
   Data
   ============================================================ */
const ORDER_ROWS = [
  {
    brand: 'Apple',
    logo: '/images/brands/apple.png',
    date: 'Mar 15, 2026 at 2:34 PM',
    amount: '$91.50',
    status: 'Delivered' as const,
  },
  {
    brand: 'Chipotle',
    logo: '/images/brands/chipotle.png',
    date: 'Mar 14, 2026 at 11:20 AM',
    amount: '$44.00',
    status: 'Delivered' as const,
  },
  {
    brand: 'Microsoft',
    logo: '/images/brands/microsoft.png',
    date: 'Mar 14, 2026 at 9:15 AM',
    amount: '$187.60',
    status: 'Processing' as const,
  },
  {
    brand: "Domino's",
    logo: '/images/brands/dominos.png',
    date: 'Mar 13, 2026 at 6:45 PM',
    amount: '$21.25',
    status: 'Delivered' as const,
  },
  {
    brand: 'eBay',
    logo: '/images/brands/ebay.png',
    date: 'Mar 12, 2026 at 3:10 PM',
    amount: '$67.65',
    status: 'Pending' as const,
  },
];

const STATUS_STYLES: Record<
  'Delivered' | 'Processing' | 'Pending',
  { bg: string; color: string }
> = {
  Delivered: { bg: '#E8F5E9', color: '#2D7A2F' },
  Processing: { bg: '#E3F2FD', color: '#1565C0' },
  Pending: { bg: '#FFF3E0', color: '#E65100' },
};

const BAR_DATA = [
  { label: 'Oct', pct: 45 },
  { label: 'Nov', pct: 62 },
  { label: 'Dec', pct: 85 },
  { label: 'Jan', pct: 55 },
  { label: 'Feb', pct: 70 },
  { label: 'Mar', pct: 92 },
];

/* ============================================================
   SVG Icons (inline, 16px)
   ============================================================ */
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function CirclePlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ============================================================
   Variant content
   ============================================================ */
const VARIANTS: Record<
  Variant,
  {
    bg: string;
    label: string;
    headline: string;
    body: string;
    cta: string;
    pills: { label: string; icon: React.ReactNode }[];
    glowColor: string;
  }
> = {
  'order-management': {
    bg: '#F5F0E8',
    label: 'Order Management',
    headline: 'Track every order, celebrate every save',
    body: 'Keep tabs on all your gift card purchases in one place. Real-time delivery tracking, instant confirmation, and a complete purchase history at your fingertips.',
    cta: 'Start tracking',
    pills: [
      { label: 'Order Tracking', icon: <ClockIcon /> },
      { label: 'Instant Delivery', icon: <ShieldCheckIcon /> },
      { label: 'Purchase History', icon: <ListIcon /> },
      { label: 'Rewards', icon: <StarIcon /> },
    ],
    glowColor: 'rgba(147,197,253,0.3)',
  },
  'savings-analytics': {
    bg: '#FAF7F2',
    label: 'Savings Analytics',
    headline: 'Watch your savings grow in real-time',
    body: 'Every purchase adds up. Our savings dashboard shows exactly how much you have kept in your pocket, with monthly breakdowns and spending insights.',
    cta: 'See your savings',
    pills: [
      { label: 'Savings Calculator', icon: <GridIcon /> },
      { label: 'Budget Tracking', icon: <CirclePlusIcon /> },
      { label: 'Price Alerts', icon: <TrendingUpIcon /> },
      { label: 'Bulk Discounts', icon: <LockIcon /> },
    ],
    glowColor: 'rgba(255,200,150,0.3)',
  },
};

/* ============================================================
   Order Mockup Card
   ============================================================ */
function OrderMockupCard() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #E8E3DB',
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        width: '100%',
        maxWidth: 480,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>
          Recent Orders
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#9A9A9A',
            background: '#F5F5F5',
            padding: '4px 10px',
            borderRadius: 999,
          }}
        >
          This month
        </span>
      </div>

      {/* Rows */}
      {ORDER_ROWS.map((row, i) => {
        const statusStyle = STATUS_STYLES[row.status];
        return (
          <div
            key={row.brand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 0',
              borderBottom:
                i < ORDER_ROWS.length - 1 ? '1px solid #F2F2F2' : 'none',
            }}
          >
            {/* Brand icon */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                overflow: 'hidden',
                flexShrink: 0,
                background: '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src={row.logo}
                alt={row.brand}
                width={40}
                height={40}
                style={{ objectFit: 'contain', padding: 4 }}
              />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#1A1A1A',
                  marginBottom: 2,
                }}
              >
                {row.brand}
              </div>
              <div style={{ fontSize: 12, color: '#9A9A9A' }}>{row.date}</div>
            </div>

            {/* Amount */}
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1A1A1A',
                flexShrink: 0,
                marginRight: 8,
              }}
            >
              {row.amount}
            </div>

            {/* Status badge */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 6,
                background: statusStyle.bg,
                color: statusStyle.color,
                flexShrink: 0,
              }}
            >
              {row.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Savings Mockup Card
   ============================================================ */
function SavingsMockupCard() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #E8E3DB',
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        width: '100%',
        maxWidth: 480,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 13, color: '#9A9A9A', fontWeight: 500 }}>
            Total Saved
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#9A9A9A',
              background: '#F5F5F5',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            Last 6 months
          </span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#1A1A1A' }}>
          $2,847.50
        </div>
      </div>

      {/* Budget */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>
            Monthly Budget
          </span>
          <span style={{ fontSize: 13, color: '#9A9A9A' }}>$680 / $1,000</span>
        </div>
        <div
          style={{
            height: 8,
            background: '#F0F0F0',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '68%',
              background: '#1A1A1A',
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          height: 140,
          paddingTop: 20,
        }}
      >
        {BAR_DATA.map((bar) => (
          <div
            key={bar.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${bar.pct}%`,
                background: '#1A1A1A',
                borderRadius: '6px 6px 0 0',
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: '#9A9A9A',
                marginTop: 6,
              }}
            >
              {bar.label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 16,
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#9A9A9A',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#1A1A1A',
              display: 'inline-block',
            }}
          />
          Savings
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#9A9A9A',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#D9D9D9',
              display: 'inline-block',
            }}
          />
          Spend
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Clamp helper
   ============================================================ */
function clamp(min: number, max: number, val: number) {
  return Math.min(max, Math.max(min, val));
}

/* ============================================================
   Main Component
   ============================================================ */
export default function FeatureSection({
  variant,
  reversed = false,
}: FeatureSectionProps) {
  const visualRef = useRef<HTMLDivElement>(null);

  /* Parallax scroll effect */
  useEffect(() => {
    const el = visualRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      const offset = (center - viewCenter) * 0.06;
      el.style.transform = `translateY(${clamp(-40, 40, offset)}px)`;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const data = VARIANTS[variant];

  const textSide = (
    <div style={{ maxWidth: 480 }}>
      {/* Label */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: '#8A7A6A',
          textAlign: 'left' as const,
          marginBottom: 16,
        }}
      >
        {data.label}
      </div>

      {/* Headline */}
      <h2
        style={{
          fontSize: 'clamp(28px, 3.5vw, 40px)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          color: '#1A1A1A',
          margin: 0,
        }}
      >
        {data.headline}
      </h2>

      {/* Body */}
      <p
        style={{
          fontSize: 18,
          color: '#6B6B6B',
          lineHeight: 1.65,
          maxWidth: 600,
          marginTop: 20,
          marginBottom: 0,
        }}
      >
        {data.body}
      </p>

      {/* CTA */}
      <button
        style={{
          marginTop: 32,
          background: '#1A1A1A',
          color: '#fff',
          padding: '14px 32px',
          borderRadius: 999,
          fontWeight: 500,
          fontSize: 16,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#333';
          (e.currentTarget as HTMLButtonElement).style.transform =
            'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#1A1A1A';
          (e.currentTarget as HTMLButtonElement).style.transform =
            'translateY(0)';
        }}
      >
        {data.cta}
      </button>

      {/* Pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: 10,
          marginTop: 24,
        }}
      >
        {data.pills.map((pill) => (
          <span
            key={pill.label}
            style={{
              background: '#fff',
              border: '1px solid #E8E3DB',
              padding: '10px 18px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 500,
              color: '#1A1A1A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {pill.icon}
            {pill.label}
          </span>
        ))}
      </div>
    </div>
  );

  const visualSide = (
    <div
      ref={visualRef}
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          borderRadius: '50%',
          filter: 'blur(60px)',
          zIndex: -1,
          opacity: 0.7,
          background: data.glowColor,
          pointerEvents: 'none',
        }}
      />
      {variant === 'order-management' ? (
        <OrderMockupCard />
      ) : (
        <SavingsMockupCard />
      )}
    </div>
  );

  return (
    <section
      style={{
        padding: '140px 0',
        overflow: 'hidden',
        background: data.bg,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        <div
          className="feature-section-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          {reversed ? (
            <>
              {textSide}
              <div style={{ order: -1 }} className="feature-visual-col">
                {visualSide}
              </div>
            </>
          ) : (
            <>
              {visualSide}
              {textSide}
            </>
          )}
        </div>
      </div>

      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .feature-section-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .feature-visual-col {
            order: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}
