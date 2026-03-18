'use client';

const testimonials = [
  {
    name: 'David Kim',
    role: 'Account Executive',
    initials: 'DK',
    color: '#6366F1',
    text: 'I buy gift cards for client gifts every month. Stashly saves me at least 10% each time. The interface is beautiful and checkout is instant.',
  },
  {
    name: 'Sarah Rodriguez',
    role: 'Marketing Manager',
    initials: 'SR',
    color: '#EC4899',
    text: 'The savings tracker is addictive. Watching my total savings grow gives me the same satisfaction as a good investment portfolio.',
  },
  {
    name: 'Alex Thompson',
    role: 'VP of Operations',
    initials: 'AT',
    color: '#F59E0B',
    text: 'We switched our entire corporate gifting program to Stashly. The bulk discounts and instant delivery made it a no-brainer.',
  },
  {
    name: 'Maria Liu',
    role: 'Small Business Owner',
    initials: 'ML',
    color: '#10B981',
    text: 'I was skeptical about discounted gift cards but Stashly is completely legitimate. Every card works perfectly and delivery is almost instant.',
  },
  {
    name: 'Ryan Nakamura',
    role: 'Software Engineer',
    initials: 'RN',
    color: '#8B5CF6',
    text: 'The reward points are the cherry on top. I earn points on every purchase and redeem them for even bigger discounts. Brilliant system.',
  },
  {
    name: 'Patricia Wells',
    role: 'Elementary School Teacher',
    initials: 'PW',
    color: '#EF4444',
    text: 'As a teacher, I buy gift cards for classroom rewards. Stashly lets me stretch my limited budget so much further. Grateful for this service.',
  },
];

function TestimonialCard({
  t,
}: {
  t: (typeof testimonials)[number];
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px',
        width: '340px',
        flexShrink: 0,
      }}
    >
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-body)',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}
      >
        &ldquo;{t.text}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: t.color,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {t.initials}
        </div>
        <div>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {t.name}
          </p>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-light)',
              lineHeight: 1.3,
            }}
          >
            {t.role}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const doubled = [...testimonials, ...testimonials];

  return (
    <section style={{ background: 'var(--bg-light)', padding: '140px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Featured Quote */}
        <div
          className="reveal"
          style={{
            maxWidth: '800px',
            margin: '0 auto 80px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(28px, 3.5vw, 44px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#1A1A1A',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              marginBottom: '32px',
            }}
          >
            &ldquo;Stashly completely changed how our team handles employee
            rewards. We save thousands every quarter on gift cards.&rdquo;
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#1A1A1A',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              JM
            </div>
            <div style={{ textAlign: 'left' }}>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                }}
              >
                Jessica Martinez
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-light)',
                  lineHeight: 1.3,
                }}
              >
                Head of People, Meridian Labs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling Carousel — full width */}
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Left fade */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: 'linear-gradient(to right, #FAF7F2, transparent)',
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
            width: '100px',
            background: 'linear-gradient(to left, #FAF7F2, transparent)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        {/* Track */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            width: 'max-content',
            animation: 'scroll-left 45s linear infinite',
          }}
        >
          {doubled.map((t, i) => (
            <TestimonialCard key={`${t.initials}-${i}`} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
