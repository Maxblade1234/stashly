'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, X } from 'lucide-react';

/* ============================================================
   Data
   ============================================================ */
const retailers = [
  'Apple',
  'Chipotle',
  'eBay',
  'Dominos',
  'Fanatics',
  'Riot Games',
  'NFL Shop',
  'Jersey Mikes',
  'New Era',
  'Off Season',
];

const howItWorksSteps = [
  {
    number: '01',
    title: 'Browse Gift Cards',
    description:
      'Explore discounted gift cards from Apple, Chipotle, eBay, and more. See real-time savings percentages before you buy.',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  },
  {
    number: '02',
    title: 'Stack Your Savings',
    description:
      'Our algorithm finds the optimal combination of gift card denominations to maximize your discount on every purchase.',
    image:
      'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&q=80',
  },
  {
    number: '03',
    title: 'One-Click Checkout',
    description:
      'Purchase securely with instant digital delivery. Your gift card codes are ready in seconds, not days.',
    image:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
  },
  {
    number: '04',
    title: 'Apply & Save',
    description:
      'Use your codes at checkout and keep the savings. Any leftover balance stays in your Stashly wallet.',
    image:
      'https://images.unsplash.com/photo-1556741533-411cf82e4e2d?w=800&q=80',
  },
];

const faqItems = [
  {
    question: 'Are the gift cards legitimate?',
    answer:
      'Yes, all gift cards sold on Stashly are 100% legitimate digital gift cards sourced directly from authorized distributors. Every card is verified before delivery.',
  },
  {
    question: 'How fast is delivery?',
    answer:
      'Instant. After purchase, your gift card codes are delivered digitally in seconds. No waiting for physical cards or email delays.',
  },
  {
    question: 'How much can I actually save?',
    answer:
      'Savings vary by retailer, but most customers save between 5-15% on every purchase. Our stacking algorithm optimizes your savings automatically.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Absolutely. We use bank-level encryption and never store your full payment details. All transactions are processed through Stripe, a PCI Level 1 certified processor.',
  },
  {
    question: 'What happens to leftover gift card balance?',
    answer:
      'Any remaining balance stays on your gift card and can be used on future purchases. Nothing is ever lost or wasted.',
  },
];

const socialProofCards = [
  {
    stat: '$2M+',
    description: 'in gift cards sold',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  },
  {
    stat: '50,000+',
    description: 'happy customers',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  },
  {
    stat: 'Up to 15%',
    description: 'average savings',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  },
];

const footerLinks = {
  Product: [
    { label: 'Gift Cards', href: '/gift-cards' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#' },
    { label: 'Chrome Extension', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '#' },
  ],
  Support: [
    { label: 'Help Center', href: '#' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Status', href: '#' },
  ],
};

/* ============================================================
   Scroll Reveal Hook
   ============================================================ */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let hasInitialized = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });

        // After first callback, enable animations for remaining elements
        if (!hasInitialized) {
          hasInitialized = true;
          requestAnimationFrame(() => {
            el.classList.add('reveal-ready');
          });
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = el.querySelectorAll('.reveal');
    revealElements.forEach((r) => observer.observe(r));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ============================================================
   Main Page Component
   ============================================================ */
export default function LandingPage() {
  const pageRef = useScrollReveal();
  const [activeStep, setActiveStep] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div ref={pageRef}>
      {/* ========== HERO ========== */}
      <HeroSection />

      {/* ========== VALUE PROPOSITION ========== */}
      <ValueProposition />

      {/* ========== LOGO TICKER ========== */}
      <LogoTicker />

      {/* ========== FEATURE HIGHLIGHT ========== */}
      <FeatureHighlight />

      {/* ========== HOW IT WORKS ========== */}
      <HowItWorks activeStep={activeStep} setActiveStep={setActiveStep} />

      {/* ========== SOCIAL PROOF ========== */}
      <SocialProof />

      {/* ========== FAQ ========== */}
      <FaqSection activeFaq={activeFaq} setActiveFaq={setActiveFaq} />

      {/* ========== CLOSING CTA ========== */}
      <ClosingCta />

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
}

/* ============================================================
   Section 1: Hero
   ============================================================ */
function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center -mt-16 overflow-hidden"
      style={{ backgroundColor: '#1A1A1A' }}
    >
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.50) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-16">
        {/* Trust badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-10"
          style={{
            backgroundColor: 'rgba(45, 122, 47, 0.15)',
            color: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(45, 122, 47, 0.25)',
          }}
        >
          <span>&#11088;</span>
          Trusted by 10,000+ shoppers
        </div>

        {/* Headline */}
        <h1
          className="font-semibold mb-6"
          style={{
            fontSize: 'clamp(38px, 5.5vw, 72px)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
          }}
        >
          Save more at checkout.
          <br />
          Every single time.
        </h1>

        {/* Sub-description */}
        <p
          className="mx-auto mb-10"
          style={{
            fontSize: 'clamp(16px, 1.5vw, 20px)',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '620px',
            fontWeight: 400,
          }}
        >
          Stashly automatically finds discounted gift cards and stacks them at
          checkout, saving you up to 15% on every purchase.
        </p>

        {/* CTA */}
        <Link
          href="/signup"
          className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-base transition-all"
          style={{
            backgroundColor: '#C8E640',
            color: '#1A1A1A',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#B8D636';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#C8E640';
          }}
        >
          Get Started Free
          <ArrowRight
            size={18}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>

      {/* Trust bar at bottom */}
      <div className="relative z-10 w-full mt-auto pb-10 pt-20">
        <div className="max-w-4xl mx-auto px-6">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-5 text-center"
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
              letterSpacing: '0.1em',
            }}
          >
            Supported retailers
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {['Apple', 'Chipotle', 'eBay', 'Dominos', 'Fanatics'].map(
              (name) => (
                <span
                  key={name}
                  className="text-sm font-medium"
                  style={{ color: 'rgba(255, 255, 255, 0.35)' }}
                >
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section 2: Value Proposition
   ============================================================ */
function ValueProposition() {
  return (
    <section
      id="value-prop"
      className="reveal"
      style={{
        padding: 'clamp(80px, 10vw, 160px) 0',
        backgroundColor: '#FDFAF6',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="font-semibold mb-5"
            style={{
              fontSize: 'clamp(32px, 4vw, 52px)',
              letterSpacing: '-0.02em',
              color: '#1A1A1A',
              lineHeight: 1.1,
            }}
          >
            A smarter way to save at checkout.
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#6B6B6B',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Stashly finds and stacks discounted gift cards automatically, so you
            never overpay again.
          </p>
        </div>

        {/* Two-column cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Savings Breakdown */}
          <div>
            <div
              className="rounded-2xl p-8 md:p-10"
              style={{ backgroundColor: '#F2EDE5' }}
            >
              {/* Mockup of savings breakdown UI */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: '#9A9A9A', letterSpacing: '0.05em' }}
                  >
                    Savings Breakdown
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(45, 122, 47, 0.1)',
                      color: '#2D7A2F',
                    }}
                  >
                    12% off
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Apple $50 Gift Card', price: '$43.50', save: '$6.50' },
                    { label: 'Apple $25 Gift Card', price: '$22.25', save: '$2.75' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2"
                      style={{
                        borderBottom: '1px solid #E8E3DB',
                      }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: '#1A1A1A', fontWeight: 500 }}
                      >
                        {item.label}
                      </span>
                      <div className="text-right">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: '#1A1A1A' }}
                        >
                          {item.price}
                        </span>
                        <span
                          className="text-xs ml-2"
                          style={{ color: '#2D7A2F' }}
                        >
                          Save {item.save}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: '#1A1A1A' }}
                    >
                      Total
                    </span>
                    <div>
                      <span
                        className="text-sm line-through mr-2"
                        style={{ color: '#9A9A9A' }}
                      >
                        $75.00
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: '#2D7A2F' }}
                      >
                        $65.75
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p
              className="mt-4 text-center"
              style={{ color: '#6B6B6B', fontSize: '15px' }}
            >
              See exactly how much you save before you buy
            </p>
          </div>

          {/* Card 2: Gift Card Codes */}
          <div>
            <div
              className="rounded-2xl p-8 md:p-10"
              style={{ backgroundColor: '#F2EDE5' }}
            >
              {/* Mockup of gift card delivery */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: '#9A9A9A', letterSpacing: '0.05em' }}
                  >
                    Your Gift Cards
                  </span>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(200, 230, 64, 0.2)',
                      color: '#1A1A1A',
                    }}
                  >
                    Delivered
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      brand: 'Apple',
                      code: 'XKWJ-8R4N-PMTL',
                      amount: '$50.00',
                    },
                    {
                      brand: 'Apple',
                      code: 'YN2F-5GHQ-VBRD',
                      amount: '$25.00',
                    },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 px-4 rounded-lg"
                      style={{ backgroundColor: '#FDFAF6' }}
                    >
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: '#1A1A1A' }}
                        >
                          {card.brand}
                        </p>
                        <p
                          className="text-xs font-mono mt-0.5"
                          style={{ color: '#9A9A9A' }}
                        >
                          {card.code}
                        </p>
                      </div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: '#1A1A1A' }}
                      >
                        {card.amount}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: '#1A1A1A',
                    color: '#FFFFFF',
                  }}
                >
                  Copy All Codes
                </button>
              </div>
            </div>
            <p
              className="mt-4 text-center"
              style={{ color: '#6B6B6B', fontSize: '15px' }}
            >
              Codes delivered instantly, ready to use
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section 3: Logo Ticker
   ============================================================ */
function LogoTicker() {
  return (
    <section
      className="reveal overflow-hidden"
      style={{
        padding: '80px 0',
        backgroundColor: '#FDFAF6',
        borderTop: '1px solid #E8E3DB',
        borderBottom: '1px solid #E8E3DB',
      }}
    >
      <p
        className="text-center text-xs font-medium uppercase tracking-widest mb-10"
        style={{ color: '#9A9A9A', letterSpacing: '0.1em' }}
      >
        Works at your favorite stores
      </p>
      <div className="relative overflow-hidden">
        <div className="ticker-track">
          {/* Double the items for seamless loop */}
          {[...retailers, ...retailers].map((name, i) => (
            <span
              key={i}
              className="inline-block px-10 text-2xl font-medium whitespace-nowrap"
              style={{ color: '#9A9A9A' }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section 4: Feature Highlight
   ============================================================ */
function FeatureHighlight() {
  return (
    <section
      id="feature-highlight"
      className="reveal"
      style={{
        padding: 'clamp(80px, 10vw, 160px) 0',
        backgroundColor: '#FDFAF6',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: Content */}
          <div>
            <p
              className="text-xs font-medium uppercase tracking-widest mb-5"
              style={{ color: '#9A9A9A', letterSpacing: '0.05em' }}
            >
              Smart Stacking
            </p>
            <h2
              className="font-semibold mb-6"
              style={{
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                lineHeight: 1.1,
              }}
            >
              The algorithm that maximizes every dollar.
            </h2>
            <p
              className="mb-8"
              style={{
                fontSize: '17px',
                color: '#6B6B6B',
                lineHeight: 1.7,
                maxWidth: '480px',
              }}
            >
              Our proprietary stacking algorithm analyzes hundreds of gift card
              combinations in milliseconds to find the optimal mix of
              denominations. It factors in discount rates, remaining balances,
              and your purchase amount to ensure you never leave savings on the
              table.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: '#1A1A1A',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1A1A1A';
              }}
            >
              See How It Works
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right: Image */}
          <div>
            <div
              className="rounded-2xl overflow-hidden aspect-[4/3]"
              style={{
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section 5: How It Works (Numbered Accordion)
   ============================================================ */
function HowItWorks({
  activeStep,
  setActiveStep,
}: {
  activeStep: number;
  setActiveStep: (i: number) => void;
}) {
  return (
    <section
      id="how-it-works"
      className="reveal"
      style={{
        padding: 'clamp(80px, 10vw, 160px) 0',
        backgroundColor: '#F2EDE5',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <p
          className="text-xs font-medium uppercase tracking-widest mb-5"
          style={{ color: '#9A9A9A', letterSpacing: '0.05em' }}
        >
          How It Works
        </p>
        <h2
          className="font-semibold mb-16"
          style={{
            fontSize: 'clamp(28px, 3.5vw, 44px)',
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
            lineHeight: 1.1,
          }}
        >
          Four simple steps to savings.
        </h2>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          {/* Left: Accordion */}
          <div>
            {howItWorksSteps.map((step, i) => (
              <div
                key={i}
                style={{
                  borderBottom: '1px solid #E8E3DB',
                }}
              >
                <button
                  onClick={() => setActiveStep(i)}
                  className="w-full flex items-start gap-5 py-6 text-left transition-colors"
                >
                  <span
                    className="text-sm font-medium mt-0.5 shrink-0"
                    style={{
                      color: activeStep === i ? '#1A1A1A' : '#9A9A9A',
                    }}
                  >
                    {step.number}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className="text-lg transition-colors"
                        style={{
                          fontWeight: activeStep === i ? 600 : 400,
                          color: activeStep === i ? '#1A1A1A' : '#9A9A9A',
                        }}
                      >
                        {step.title}
                      </h3>
                      <ArrowRight
                        size={16}
                        className="shrink-0 transition-all"
                        style={{
                          color: activeStep === i ? '#1A1A1A' : '#9A9A9A',
                          opacity: activeStep === i ? 1 : 0.5,
                          transform:
                            activeStep === i
                              ? 'translateX(0)'
                              : 'translateX(-4px)',
                        }}
                      />
                    </div>
                    <div
                      className={`accordion-content ${activeStep === i ? 'open' : ''}`}
                    >
                      <p
                        className="mt-3"
                        style={{
                          fontSize: '15px',
                          color: '#6B6B6B',
                          lineHeight: 1.6,
                          maxWidth: '420px',
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Right: Contextual Image */}
          <div className="hidden md:block sticky top-24">
            <div
              className="rounded-2xl overflow-hidden aspect-[4/3] transition-all duration-500"
              style={{
                backgroundImage: `url(${howItWorksSteps[activeStep].image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section 6: Social Proof
   ============================================================ */
function SocialProof() {
  return (
    <section
      className="reveal"
      style={{
        padding: 'clamp(80px, 10vw, 160px) 0',
        backgroundColor: '#FDFAF6',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="font-semibold"
            style={{
              fontSize: 'clamp(28px, 3.5vw, 44px)',
              letterSpacing: '-0.02em',
              color: '#1A1A1A',
              lineHeight: 1.1,
            }}
          >
            Real results from real savings
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {socialProofCards.map((card, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden"
              style={{ aspectRatio: '3 / 4' }}
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 100%)',
                }}
              />
              {/* Brand watermark */}
              <div className="absolute top-5 left-5">
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  stashly
                </span>
              </div>
              {/* Stat */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <p
                  className="font-bold mb-1"
                  style={{
                    fontSize: 'clamp(36px, 4vw, 48px)',
                    color: '#FFFFFF',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {card.stat}
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section 7: FAQ
   ============================================================ */
function FaqSection({
  activeFaq,
  setActiveFaq,
}: {
  activeFaq: number | null;
  setActiveFaq: (i: number | null) => void;
}) {
  return (
    <section
      id="faq"
      className="reveal"
      style={{
        padding: 'clamp(80px, 10vw, 160px) 0',
        backgroundColor: '#FDFAF6',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 md:gap-20">
          {/* Left column */}
          <div className="md:col-span-2">
            <h2
              className="font-semibold mb-6"
              style={{
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                lineHeight: 1.1,
              }}
            >
              Questions all resolved in one place.
            </h2>
            <a
              href="mailto:support@stashly.app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: '#1A1A1A',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1A1A1A';
              }}
            >
              Contact Us
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Right column: Accordion */}
          <div className="md:col-span-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                style={{ borderBottom: '1px solid #E8E3DB' }}
              >
                <button
                  onClick={() =>
                    setActiveFaq(activeFaq === i ? null : i)
                  }
                  className="w-full flex items-center justify-between py-5 text-left"
                >
                  <span
                    className="text-base pr-4"
                    style={{
                      fontWeight: 500,
                      color: '#1A1A1A',
                    }}
                  >
                    {item.question}
                  </span>
                  <span
                    className={`accordion-icon shrink-0 ${activeFaq === i ? 'open' : ''}`}
                    style={{ color: '#9A9A9A' }}
                  >
                    <Plus size={20} />
                  </span>
                </button>
                <div
                  className={`accordion-content ${activeFaq === i ? 'open' : ''}`}
                >
                  <p
                    className="pb-5"
                    style={{
                      fontSize: '15px',
                      color: '#6B6B6B',
                      lineHeight: 1.7,
                      maxWidth: '540px',
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section 8: Closing CTA
   ============================================================ */
function ClosingCta() {
  return (
    <section
      className="reveal"
      style={{
        padding: 'clamp(80px, 10vw, 140px) 0',
        backgroundColor: '#1A1A1A',
      }}
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2
          className="font-semibold mb-6"
          style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            lineHeight: 1.1,
          }}
        >
          Start saving on every purchase today.
        </h2>
        <p
          className="mb-10"
          style={{
            fontSize: '17px',
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: 1.6,
          }}
        >
          Join thousands of shoppers who never pay full price.
        </p>
        <Link
          href="/signup"
          className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-base transition-all"
          style={{
            backgroundColor: '#C8E640',
            color: '#1A1A1A',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#B8D636';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#C8E640';
          }}
        >
          Create Free Account
          <ArrowRight
            size={18}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
        <p
          className="mt-5"
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          No credit card required. Free forever.
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   Section 9: Footer
   ============================================================ */
function Footer() {
  return (
    <footer style={{ backgroundColor: '#1A1A1A' }}>
      {/* Divider */}
      <div
        className="mx-auto"
        style={{
          maxWidth: '1152px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      />

      <div
        className="max-w-6xl mx-auto px-6"
        style={{ padding: '64px 24px 40px' }}
      >
        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p
                className="text-xs font-medium uppercase tracking-wider mb-4"
                style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}
              >
                {category}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            stashly
          </span>
          <p
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            &copy; {new Date().getFullYear()} Stashly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
