'use client';

const paymentRow1 = [
  'Apple Pay', 'Google Pay', 'PayPal', 'Venmo', 'Visa', 'Mastercard',
];
const paymentRow2 = [
  'Amex', 'Discover', 'Cash App', 'Zelle', 'Stripe', 'ACH',
];

const swatches = [
  { color: '#1A1A1A', active: true },
  { color: '#6366F1', active: false },
  { color: '#EC4899', active: false },
  { color: '#F59E0B', active: false },
  { color: '#10B981', active: false },
];

function PaymentRow({
  items,
  direction,
  speed = 20,
}: {
  items: string[];
  direction: 'left' | 'right';
  speed?: number;
}) {
  const doubled = [...items, ...items];
  const animation =
    direction === 'left'
      ? `scroll-left ${speed}s linear infinite`
      : `scroll-right ${speed}s linear infinite`;

  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Left fade */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(to right, #fff, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      {/* Right fade */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(to left, #fff, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          display: 'flex',
          gap: '12px',
          width: 'max-content',
          animation,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-light)',
              whiteSpace: 'nowrap',
              padding: '10px 20px',
              background: '#F5F5F5',
              borderRadius: '999px',
              flexShrink: 0,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BenefitsGrid() {
  return (
    <section style={{ background: 'var(--bg-warm)', padding: '140px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 64px',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '16px',
            }}
          >
            Features
          </p>
          <h2
            style={{
              fontSize: 'clamp(30px, 4vw, 44px)',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}
          >
            Built for smart shoppers, powered by simplicity
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-body)',
              lineHeight: 1.6,
            }}
          >
            Every detail is designed to make buying gift cards effortless and
            rewarding.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
          className="max-md:!grid-cols-1"
        >
          {/* Card 1: Personalize */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '40px',
              overflow: 'hidden',
            }}
            className="max-md:!p-[28px]"
          >
            <h3
              style={{
                fontSize: '22px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Personalize every detail
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-body)',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              Set your favorite brands, preferred denominations, and notification
              preferences. Stashly adapts to how you shop.
            </p>

            {/* Color swatches */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              {swatches.map((s) => (
                <div
                  key={s.color}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: s.color,
                    border: `3px solid ${s.active ? '#1A1A1A' : 'transparent'}`,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>

            {/* Dark mode toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: '#F5F5F5',
                borderRadius: '12px',
                width: 'fit-content',
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                Dark mode
              </span>
              <div
                style={{
                  width: '44px',
                  height: '24px',
                  background: '#1A1A1A',
                  borderRadius: '12px',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: '22px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Payment Methods */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '40px',
              overflow: 'hidden',
            }}
            className="max-md:!p-[28px]"
          >
            <h3
              style={{
                fontSize: '22px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Integrates with your payment methods
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-body)',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              Pay the way you want. We support all major payment methods for a
              seamless checkout experience.
            </p>

            {/* Payment carousel */}
            <PaymentRow items={paymentRow1} direction="left" speed={20} />
            <div style={{ marginTop: '16px' }}>
              <PaymentRow items={paymentRow2} direction="right" speed={20} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
