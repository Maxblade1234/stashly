'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { RateComparison, StackRecommendation } from '@stashly/shared';

/* ────────────────────────────────────────────────────────────────
   Checkout simulator
   Recreates what the Chrome extension does on a real retailer
   checkout page, using the same APIs the extension calls. Nothing
   here is faked on the client: the stack and the marketplace
   comparison come back from the server on every run.
   ──────────────────────────────────────────────────────────────── */

interface CartItem { name: string; detail: string; price: number }
interface RetailerScenario {
  name: string;
  domain: string;
  checkoutPath: string;
  logo: string;
  accent: string;
  items: CartItem[];
}

const SCENARIOS: RetailerScenario[] = [
  {
    name: 'Apple', domain: 'apple.com', checkoutPath: '/shop/checkout', logo: '/images/brands/apple.png', accent: '#1A1A1A',
    items: [
      { name: 'MacBook Air 13"', detail: 'M4 · 16GB · 256GB · Midnight', price: 999 },
      { name: 'AirPods Pro 2', detail: 'USB-C · MagSafe case', price: 249 },
    ],
  },
  {
    name: 'Chipotle', domain: 'chipotle.com', checkoutPath: '/order/checkout', logo: '/images/brands/chipotle.png', accent: '#A81612',
    items: [
      { name: 'Burrito Bowl ×2', detail: 'Chicken · extra guac', price: 23.5 },
      { name: 'Chips & Queso', detail: 'Large', price: 5.45 },
    ],
  },
  {
    name: 'Dominos', domain: 'dominos.com', checkoutPath: '/pages/order/checkout', logo: '/images/brands/dominos.png', accent: '#0A6EB5',
    items: [
      { name: 'Large Pepperoni ×2', detail: 'Hand tossed', price: 27.98 },
      { name: 'Cinnamon Bread Twists', detail: '', price: 6.99 },
    ],
  },
  {
    name: 'eBay', domain: 'ebay.com', checkoutPath: '/pay/', logo: '/images/brands/ebay.png', accent: '#E53238',
    items: [
      { name: 'Sony WH-1000XM5', detail: 'Refurbished · Excellent', price: 189.99 },
    ],
  },
  {
    name: 'Fanatics', domain: 'fanatics.com', checkoutPath: '/checkout', logo: '/images/brands/fanatics.png', accent: '#0F2C5C',
    items: [
      { name: 'Nike Game Jersey', detail: 'Home · Size L', price: 129.99 },
      { name: 'New Era 59FIFTY', detail: '7 3/8', price: 44.99 },
    ],
  },
];

type Phase = 'idle' | 'detecting' | 'comparing' | 'ready' | 'applying' | 'applied' | 'error';

interface TraceEntry { label: string; ms: number; ok: boolean }

const money = (n: number) => `$${n.toFixed(2)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fakeCode = () => `DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export default function DemoPage() {
  const [scenario, setScenario] = useState<RetailerScenario>(SCENARIOS[0]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stack, setStack] = useState<StackRecommendation | null>(null);
  const [rates, setRates] = useState<RateComparison | null>(null);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [appliedCodes, setAppliedCodes] = useState<string[]>([]);
  const [typingCode, setTypingCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const runId = useRef(0);

  const cartTotal = scenario.items.reduce((s, i) => s + i.price, 0);
  const appliedValue = stack && phase === 'applied' ? stack.total_gift_card_value : 0;
  const dueNow = Math.max(0, cartTotal - Math.min(appliedValue, cartTotal));

  const run = useCallback(async (s: RetailerScenario) => {
    const id = ++runId.current;
    setScenario(s);
    setPhase('detecting');
    setStack(null);
    setRates(null);
    setTrace([]);
    setAppliedCodes([]);
    setTypingCode('');
    setErrorMsg('');

    const total = s.items.reduce((sum, i) => sum + i.price, 0);
    await sleep(900); // detection: route match + DOM settle, as the extension waits
    if (id !== runId.current) return;
    setPhase('comparing');

    const timed = async <T,>(label: string, fn: () => Promise<T>): Promise<T | null> => {
      const t0 = performance.now();
      try {
        const v = await fn();
        setTrace((tr) => [...tr, { label, ms: Math.round(performance.now() - t0), ok: true }]);
        return v;
      } catch {
        setTrace((tr) => [...tr, { label, ms: Math.round(performance.now() - t0), ok: false }]);
        return null;
      }
    };

    const [stackRes, ratesRes] = await Promise.all([
      timed('POST /api/demo/stack', async () => {
        const r = await fetch('/api/demo/stack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ retailer_name: s.name, cart_total: total }),
        });
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()).stack as StackRecommendation;
      }),
      timed('GET /api/rates', async () => {
        const r = await fetch(`/api/rates?retailer=${encodeURIComponent(s.name)}&cart_total=${total}`);
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()).comparison as RateComparison;
      }),
    ]);
    if (id !== runId.current) return;

    if (!stackRes || stackRes.cards.length === 0) {
      setPhase('error');
      setErrorMsg('The demo API is not available on this deployment (it runs in demo mode only).');
      return;
    }
    setStack(stackRes);
    setRates(ratesRes);
    setPhase('ready');
  }, []);

  const apply = useCallback(async () => {
    if (!stack) return;
    const id = runId.current;
    setPhase('applying');
    const codes = stack.cards.flatMap((c) => Array.from({ length: c.quantity }, fakeCode));
    for (const code of codes) {
      // type each code into the retailer's gift card field, then "press Apply"
      for (let i = 1; i <= code.length; i++) {
        if (id !== runId.current) return;
        setTypingCode(code.slice(0, i));
        await sleep(18);
      }
      await sleep(260);
      setAppliedCodes((prev) => [...prev, code]);
      setTypingCode('');
      await sleep(180);
    }
    if (id !== runId.current) return;
    setPhase('applied');
  }, [stack]);

  useEffect(() => {
    const t = setTimeout(() => run(SCENARIOS[0]), 600);
    return () => clearTimeout(t);
  }, [run]);

  const steps: { key: Phase[]; label: string }[] = [
    { key: ['detecting'], label: 'Detect checkout' },
    { key: ['comparing'], label: 'Compare marketplaces' },
    { key: ['ready'], label: 'Build the stack' },
    { key: ['applying', 'applied'], label: 'Apply at checkout' },
  ];
  const stepIndex = steps.findIndex((st) => st.key.includes(phase));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-sky, #E8EFF7)', fontFamily: 'var(--font-outfit), Outfit, sans-serif' }}>
      {/* Header */}
      <header style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/images/stashly-icon.png" alt="Stashly" width={28} height={28} style={{ borderRadius: 7 }} />
          <span style={{ fontWeight: 600, fontSize: 17, color: '#1A1A1A' }}>Stashly</span>
          <span style={{ fontSize: 12, color: '#8A7A6A', marginLeft: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Checkout simulator</span>
        </Link>
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 }}>
          <Link href="/" style={{ color: '#6B6B6B' }}>Home</Link>
          <a href="https://github.com/Maxblade1234/stashly" target="_blank" rel="noopener noreferrer" style={{ color: '#6B6B6B' }}>Source</a>
          <Link href="/login" style={{ background: '#1A1A1A', color: '#fff', padding: '8px 18px', borderRadius: 999, fontWeight: 500, fontSize: 13 }}>Sign in</Link>
        </nav>
      </header>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 720, marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#1A1A1A', margin: 0 }}>
            See the extension work on a checkout page
          </h1>
          <p style={{ fontSize: 17, color: '#6B6B6B', lineHeight: 1.6, margin: '14px 0 0' }}>
            This page stands in for a retailer&apos;s checkout. The overlay on the right is the real extension logic:
            it detects the page, asks the server for the best gift card stack, compares partner marketplace rates,
            and fills the gift card field — everything except placing the order, which is always yours.
          </p>
        </div>

        {/* Scenario picker */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {SCENARIOS.map((s) => {
            const active = s.name === scenario.name;
            return (
              <button
                key={s.name}
                onClick={() => run(s)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 999, fontSize: 14, fontWeight: 500,
                  background: active ? '#1A1A1A' : '#fff', color: active ? '#fff' : '#1A1A1A',
                  border: `1px solid ${active ? '#1A1A1A' : '#E8E3DB'}`, transition: 'all 0.2s ease',
                }}
              >
                <Image src={s.logo} alt="" width={18} height={18} style={{ objectFit: 'contain', borderRadius: 4, background: '#fff' }} />
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Step tracker */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
          {steps.map((st, i) => {
            const done = stepIndex > i || phase === 'applied';
            const current = stepIndex === i && phase !== 'applied';
            return (
              <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, background: current ? '#fff' : 'transparent', border: `1px solid ${current ? '#E8E3DB' : 'transparent'}`, fontSize: 13, color: done ? '#2D7A2F' : current ? '#1A1A1A' : '#9A9A9A', transition: 'all 0.3s ease' }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, background: done ? '#E8F5E9' : current ? '#1A1A1A' : '#E8E3DB', color: done ? '#2D7A2F' : current ? '#fff' : '#9A9A9A' }}>
                  {done ? '✓' : i + 1}
                </span>
                {st.label}
              </div>
            );
          })}
        </div>

        {/* Stage */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }} className="demo-stage">
          {/* Mock retailer checkout */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E3DB', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
            {/* Browser chrome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F5F0E8', borderBottom: '1px solid #E8E3DB' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c }} />)}
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#6B6B6B', border: '1px solid #E8E3DB', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#2D7A2F' }}>🔒</span>
                <span><strong style={{ color: '#1A1A1A', fontWeight: 500 }}>{scenario.domain}</strong>{scenario.checkoutPath}</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: phase === 'idle' ? '#E8E3DB' : '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' }} title="Stashly extension">
                <Image src="/images/stashly-icon.png" alt="" width={18} height={18} style={{ borderRadius: 4, opacity: phase === 'idle' ? 0.4 : 1 }} />
              </div>
            </div>

            {/* Page body */}
            <div style={{ padding: 28, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 28 }} className="demo-checkout">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                  <Image src={scenario.logo} alt={scenario.name} width={28} height={28} style={{ objectFit: 'contain' }} />
                  <span style={{ fontSize: 20, fontWeight: 600, color: scenario.accent }}>{scenario.name}</span>
                  <span style={{ fontSize: 13, color: '#9A9A9A', marginLeft: 'auto' }}>Checkout · Step 3 of 3</span>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', margin: '0 0 12px' }}>Your bag</h3>
                {scenario.items.map((it) => (
                  <div key={it.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F0EDE8', fontSize: 14 }}>
                    <div>
                      <div style={{ color: '#1A1A1A', fontWeight: 500 }}>{it.name}</div>
                      {it.detail && <div style={{ color: '#9A9A9A', fontSize: 12.5 }}>{it.detail}</div>}
                    </div>
                    <div style={{ color: '#1A1A1A' }}>{money(it.price)}</div>
                  </div>
                ))}

                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', margin: '26px 0 10px' }}>Gift card or promo code</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      readOnly
                      value={typingCode}
                      placeholder="Enter gift card number"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1.5px solid ${typingCode ? '#1A1A1A' : '#E8E3DB'}`, fontSize: 14, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#1A1A1A', background: typingCode ? '#FAFAFA' : '#fff', transition: 'border-color 0.2s ease', outline: 'none' }}
                    />
                    {phase === 'applying' && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#2D7A2F', fontWeight: 600 }}>STASHLY</span>}
                  </div>
                  <button style={{ padding: '11px 18px', borderRadius: 8, background: phase === 'applying' ? '#1A1A1A' : '#F5F0E8', color: phase === 'applying' ? '#fff' : '#1A1A1A', fontSize: 14, fontWeight: 500, transition: 'all 0.2s ease' }}>Apply</button>
                </div>
                {appliedCodes.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {appliedCodes.map((c, i) => (
                      <div key={c} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#2D7A2F', background: '#E8F5E9', padding: '7px 12px', borderRadius: 6 }}>
                        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>•••• {c.slice(-4)}</span>
                        <span>Gift card applied {stack && stack.cards.length > 0 ? `· −${money(flattenDenoms(stack)[i] ?? 0)}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div style={{ background: '#FAFAFA', borderRadius: 12, padding: 18, border: '1px solid #F0EDE8', fontSize: 14, alignSelf: 'start' }}>
                <div style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>Order summary</div>
                <Row label="Subtotal" value={money(cartTotal)} />
                <Row label="Shipping" value="Free" />
                {appliedValue > 0 && <Row label="Gift cards" value={`−${money(Math.min(appliedValue, cartTotal))}`} green />}
                <div style={{ borderTop: '1px solid #E8E3DB', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#1A1A1A', fontSize: 16 }}>
                  <span>Due now</span>
                  <span style={{ transition: 'color 0.3s ease', color: appliedValue > 0 ? '#2D7A2F' : '#1A1A1A' }}>{money(dueNow)}</span>
                </div>
                {phase === 'applied' && stack && (
                  <div style={{ marginTop: 12, fontSize: 12.5, color: '#2D7A2F', background: '#E8F5E9', borderRadius: 8, padding: '8px 10px', lineHeight: 1.5 }}>
                    You paid {money(stack.total_paid)} for {money(stack.total_gift_card_value)} in gift cards — <strong>{money(stack.savings)} saved</strong> on this order.
                    {stack.residual_balance > 0 && <> {money(stack.residual_balance)} stays in your Stashly balance.</>}
                  </div>
                )}
                <button disabled style={{ width: '100%', marginTop: 14, padding: '12px', borderRadius: 8, background: '#E8E3DB', color: '#9A9A9A', fontSize: 14, fontWeight: 500, cursor: 'not-allowed' }} title="The extension never presses this — placing the order is always the user's action">
                  Place order
                </button>
                <div style={{ fontSize: 11, color: '#9A9A9A', marginTop: 8, textAlign: 'center' }}>Stashly never places orders for you.</div>
              </div>
            </div>
          </div>

          {/* Extension overlay replica */}
          <div style={{ position: 'sticky', top: 24 }}>
            <Overlay phase={phase} scenario={scenario} stack={stack} rates={rates} onApply={apply} onReplay={() => run(scenario)} errorMsg={errorMsg} />

            {/* Trace */}
            <div style={{ marginTop: 14, background: '#1A1A1A', borderRadius: 12, padding: '12px 14px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: '#B0B0B0' }}>
              <div style={{ color: '#9A9A9A', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Behind the scenes</div>
              <TraceLine ok text={`route match  ${scenario.domain}${scenario.checkoutPath}`} dim={phase === 'idle'} />
              <TraceLine ok text={`cart total   ${money(cartTotal)}`} dim={phase === 'idle' || phase === 'detecting'} />
              {trace.map((t) => <TraceLine key={t.label} ok={t.ok} text={`${t.label.padEnd(20)} ${t.ok ? `${t.ms}ms` : 'failed'}`} />)}
              {phase === 'comparing' && <TraceLine ok text="calling server…" pulse />}
              {phase === 'applied' && <TraceLine ok text="filled gift card field · dispatched input/change" />}
              {phase === 'applied' && <TraceLine ok text="stopped before place-order (by design)" />}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#8A7A6A', marginTop: 28, maxWidth: 820, lineHeight: 1.6 }}>
          Demo inventory and partner rates are representative fixtures; the stacking algorithm, the rate aggregator, and the
          API contracts are the production code paths. To run the real extension, load <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 4 }}>apps/extension</code> unpacked in Chrome — see the README.
        </p>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .demo-stage { grid-template-columns: 1fr !important; }
          .demo-stage > div:last-child { position: static !important; }
        }
        @media (max-width: 640px) {
          .demo-checkout { grid-template-columns: 1fr !important; }
        }
        @keyframes stashly-pulse { 0%, 100% { opacity: 0.4 } 50% { opacity: 1 } }
        @keyframes overlay-in { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

function flattenDenoms(stack: StackRecommendation): number[] {
  return stack.cards.flatMap((c) => Array.from({ length: c.quantity }, () => c.denomination));
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: green ? '#2D7A2F' : '#6B6B6B' }}>
      <span>{label}</span><span style={{ color: green ? '#2D7A2F' : '#1A1A1A' }}>{value}</span>
    </div>
  );
}

function TraceLine({ text, ok, dim, pulse }: { text: string; ok: boolean; dim?: boolean; pulse?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '2px 0', opacity: dim ? 0.35 : 1, animation: pulse ? 'stashly-pulse 1.2s ease-in-out infinite' : undefined, whiteSpace: 'pre' }}>
      <span style={{ color: ok ? '#C8E640' : '#FF6B6B' }}>{ok ? '›' : '×'}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
    </div>
  );
}

function Overlay({ phase, scenario, stack, rates, onApply, onReplay, errorMsg }: {
  phase: Phase; scenario: RetailerScenario; stack: StackRecommendation | null; rates: RateComparison | null;
  onApply: () => void; onReplay: () => void; errorMsg: string;
}) {
  const visible = phase !== 'idle' && phase !== 'detecting';
  const bestSource = rates?.best?.source;

  return (
    <div style={{ minHeight: 120 }}>
      {!visible && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8E3DB', padding: 18, fontSize: 14, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: phase === 'detecting' ? '#C8E640' : '#E8E3DB', animation: phase === 'detecting' ? 'stashly-pulse 1s ease-in-out infinite' : undefined }} />
          {phase === 'detecting' ? `Checkout detected on ${scenario.domain} — reading cart…` : 'Extension idle'}
        </div>
      )}

      {visible && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8E3DB', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', overflow: 'hidden', animation: 'overlay-in 0.35s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F0EDE8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Image src="/images/stashly-icon.png" alt="Stashly" width={22} height={22} style={{ borderRadius: 6 }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>Stashly</span>
            </div>
            <span style={{ fontSize: 11, color: '#9A9A9A' }}>v0.1.0</span>
          </div>

          <div style={{ padding: 16 }}>
            {phase === 'comparing' && (
              <div style={{ fontSize: 14, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: '#C8E640', animation: 'stashly-pulse 1s ease-in-out infinite' }} />
                Finding the best price for {scenario.name}…
              </div>
            )}

            {phase === 'error' && (
              <div style={{ fontSize: 13.5, color: '#6B6B6B', lineHeight: 1.5 }}>
                {errorMsg}
                <button onClick={onReplay} style={{ display: 'block', marginTop: 10, color: '#1A1A1A', fontWeight: 500, textDecoration: 'underline' }}>Retry</button>
              </div>
            )}

            {stack && (phase === 'ready' || phase === 'applying' || phase === 'applied') && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, background: '#E8F5E9', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <span style={{ fontSize: 24, fontWeight: 600, color: '#2D7A2F' }}>Save {money(stack.savings)}</span>
                  <span style={{ fontSize: 13, color: '#2D7A2F' }}>{stack.savings_percent.toFixed(1)}% off</span>
                </div>
                <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 8 }}>
                  {stack.cards.reduce((n, c) => n + c.quantity, 0)} gift card{stack.cards.reduce((n, c) => n + c.quantity, 0) > 1 ? 's' : ''} for {scenario.name}
                </div>
                <div style={{ background: '#FAFAFA', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                  {stack.cards.map((c) => (
                    <div key={c.denomination} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', padding: '3px 0' }}>
                      <span>{c.quantity}× ${c.denomination} <span style={{ color: '#9A9A9A' }}>· {c.discount_percent.toFixed(0)}% off</span></span>
                      <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 600 }}>{money(c.total_price)}</span>
                    </div>
                  ))}
                </div>

                {phase === 'ready' && (
                  <button onClick={onApply} style={{ width: '100%', padding: '12px', borderRadius: 999, background: '#C8E640', color: '#1A1A1A', fontSize: 14, fontWeight: 600, transition: 'all 0.2s ease' }}>
                    Apply {money(stack.total_gift_card_value)} in gift cards
                  </button>
                )}
                {phase === 'applying' && (
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#6B6B6B', padding: '10px 0' }}>Filling gift card fields…</div>
                )}
                {phase === 'applied' && (
                  <div style={{ background: '#E8F5E9', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#2D7A2F', textAlign: 'center' }}>
                    ✓ Applied. Review your order and place it when ready.
                    <button onClick={onReplay} style={{ display: 'block', margin: '8px auto 0', color: '#1A1A1A', fontSize: 12.5, textDecoration: 'underline' }}>Replay</button>
                  </div>
                )}

                {rates && rates.quotes.length > 0 && (
                  <div style={{ borderTop: '1px solid #E8E3DB', marginTop: 14, paddingTop: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: 6 }}>Best prices across marketplaces</div>
                    {rates.quotes.slice(0, 5).map((q) => {
                      const best = q.source === bestSource;
                      return (
                        <div key={q.source} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '5px 6px', borderRadius: 6, background: best ? '#F0FDF4' : 'transparent', color: '#374151' }}>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.source_label}{q.via ? <span style={{ color: '#9A9A9A' }}> · via {q.via}</span> : null}</span>
                          {best && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: '#DCFCE7', color: '#15803D' }}>Best</span>}
                          {q.fulfillment === 'instant' && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: '#EFF6FF', color: '#1D4ED8' }}>Instant</span>}
                          <span style={{ fontWeight: 600, color: '#15803D', fontFamily: 'ui-monospace, Menlo, monospace' }}>{q.discount_percent.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
