'use client';

import { useState } from 'react';

/* ─── Types ─── */
type Period = 'monthly' | 'annual';

interface PlanFeature {
  text: string;
}

interface Plan {
  name: string;
  monthly: string;
  annual: string;
  priceNote?: string;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
  buttonStyle: 'primary' | 'secondary';
  buttonLabel: string;
}

const plans: Plan[] = [
  {
    name: 'Free',
    monthly: '$0',
    annual: '$0',
    description:
      'Perfect for casual shoppers who want to start saving on gift cards.',
    features: [
      { text: 'Up to 5 purchases per month' },
      { text: 'Basic savings dashboard' },
      { text: 'Access to all brands' },
      { text: 'Email support' },
    ],
    buttonStyle: 'secondary',
    buttonLabel: 'Get started',
  },
  {
    name: 'Premium',
    monthly: '$9.99',
    annual: '$7.99',
    description:
      'For frequent buyers who want maximum discounts and exclusive deals.',
    features: [
      { text: 'Unlimited purchases' },
      { text: 'Extra 3% discount on all cards' },
      { text: 'Advanced savings analytics' },
      { text: '2x reward points' },
      { text: 'Price drop alerts' },
      { text: 'Priority support' },
    ],
    highlighted: true,
    badge: 'Most Popular',
    buttonStyle: 'primary',
    buttonLabel: 'Get started',
  },
  {
    name: 'Enterprise',
    monthly: 'Custom',
    annual: 'Custom',
    description:
      'For teams and businesses with high-volume gift card needs.',
    features: [
      { text: 'Everything in Premium' },
      { text: 'Extra 5% bulk discount' },
      { text: 'Team management dashboard' },
      { text: 'Custom order workflows' },
      { text: 'API access' },
      { text: 'Dedicated account manager' },
    ],
    buttonStyle: 'secondary',
    buttonLabel: 'Contact sales',
  },
];

/* ─── Check icon SVG ─── */
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      style={{ width: 18, height: 18, flexShrink: 0 }}
      fill="none"
    >
      <circle
        cx="9"
        cy="9"
        r="8"
        stroke="#2D7A2F"
        strokeWidth="1.5"
      />
      <path
        d="M6 9l2 2 4-4"
        stroke="#2D7A2F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Styles injected via <style> for pseudo-element gradient border ─── */
const cardStyles = `
.pricing-card-highlighted::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(147,197,253,0.4), rgba(147,197,253,0.1));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
`;

export default function PricingSection() {
  const [period, setPeriod] = useState<Period>('monthly');

  return (
    <>
      <style>{cardStyles}</style>
      <section
        id="pricing"
        style={{
          background: 'var(--bg-pricing, #E4EBF3)',
          padding: '140px 24px',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto 20px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-muted, #8A7A6A)',
              marginBottom: 16,
            }}
          >
            Pricing
          </p>
          <h2
            style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--text-primary, #1A1A1A)',
              margin: 0,
            }}
          >
            Simple plans for serious savings
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: 'var(--text-body, #6B6B6B)',
              marginTop: 16,
            }}
          >
            Start free, upgrade when you are ready. Every plan includes access
            to thousands of discounted gift cards.
          </p>
        </div>

        {/* ── Toggle ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            margin: '32px 0 64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              background: '#fff',
              padding: 6,
              borderRadius: 999,
              border: '1px solid #E8E3DB',
            }}
          >
            {(['monthly', 'annual'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  fontSize: 14,
                  padding: '8px 18px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  background: period === p ? '#1A1A1A' : 'transparent',
                  color: period === p ? '#fff' : 'var(--text-body, #6B6B6B)',
                  fontWeight: period === p ? 500 : 400,
                }}
              >
                {p === 'monthly' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>
          <span
            style={{
              background: 'var(--green-bg, #E8F5E9)',
              color: 'var(--green, #2D7A2F)',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 20,
            }}
          >
            Save 20%
          </span>
        </div>

        {/* ── Grid ── */}
        <div
          style={{
            display: 'grid',
            gap: 24,
            maxWidth: 1060,
            margin: '0 auto',
          }}
          className="pricing-grid"
        >
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} period={period} />
          ))}
        </div>

        {/* Responsive grid styles */}
        <style>{`
          .pricing-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          @media (max-width: 768px) {
            .pricing-grid {
              grid-template-columns: 1fr;
              max-width: 400px !important;
            }
          }
        `}</style>
      </section>
    </>
  );
}

/* ─── Card Component ─── */
function PricingCard({ plan, period }: { plan: Plan; period: Period }) {
  const price = period === 'monthly' ? plan.monthly : plan.annual;
  const isCustom = price === 'Custom';

  return (
    <div
      className={plan.highlighted ? 'pricing-card-highlighted' : undefined}
      style={{
        background: '#fff',
        border: plan.highlighted
          ? '1px solid transparent'
          : '1px solid var(--border, #E8E3DB)',
        borderRadius: 20,
        padding: 36,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: plan.highlighted
          ? '0 0 0 1px rgba(147,197,253,0.3), 0 0 40px rgba(147,197,253,0.15)'
          : 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <span
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--dark, #1A1A1A)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 16px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {plan.badge}
        </span>
      )}

      {/* Name */}
      <p
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary, #1A1A1A)',
          margin: 0,
        }}
      >
        {plan.name}
      </p>

      {/* Price */}
      <div style={{ margin: '20px 0 8px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontSize: 42,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary, #1A1A1A)',
          }}
        >
          {price}
        </span>
        {!isCustom && (
          <span style={{ fontSize: 15, color: 'var(--text-light, #9A9A9A)' }}>
            /month
          </span>
        )}
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--text-body, #6B6B6B)',
          margin: '0 0 28px',
        }}
      >
        {plan.description}
      </p>

      {/* Features */}
      <ul
        style={{
          listStyle: 'none',
          margin: '0 0 32px',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          flex: 1,
        }}
      >
        {plan.features.map((f) => (
          <li
            key={f.text}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <CheckIcon />
            <span
              style={{
                fontSize: 14,
                color: 'var(--text-body, #6B6B6B)',
              }}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <button
        style={{
          width: '100%',
          padding: '14px 24px',
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ...(plan.buttonStyle === 'primary'
            ? {
                background: 'var(--dark, #1A1A1A)',
                color: '#fff',
                border: 'none',
              }
            : {
                background: 'transparent',
                color: 'var(--text-primary, #1A1A1A)',
                border: '1.5px solid var(--border, #E8E3DB)',
              }),
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          if (plan.buttonStyle === 'primary') {
            el.style.background = 'var(--dark-hover, #333)';
          } else {
            el.style.borderColor = 'var(--text-light, #9A9A9A)';
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          if (plan.buttonStyle === 'primary') {
            el.style.background = 'var(--dark, #1A1A1A)';
          } else {
            el.style.borderColor = 'var(--border, #E8E3DB)';
          }
        }}
      >
        {plan.buttonLabel}
      </button>
    </div>
  );
}
