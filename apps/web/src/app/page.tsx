import Link from 'next/link';
import { ArrowRight, Shield, Zap, Wallet } from 'lucide-react';

const retailers = [
  'Apple', 'Chipotle', 'Dominos', 'Riot Games', 'eBay',
  'NFL Shop', 'Jersey Mikes', 'Fanatics', 'New Era', 'Off Season',
];

const steps = [
  {
    icon: Zap,
    title: 'Install Extension',
    description: 'Add the Stashly Chrome extension in one click. It runs silently until you checkout.',
  },
  {
    icon: Wallet,
    title: 'Shop Normally',
    description: 'Browse and add items to your cart like you always do. Stashly detects supported retailers.',
  },
  {
    icon: Shield,
    title: 'Save at Checkout',
    description: 'Stashly finds discounted gift cards, stacks them optimally, and applies them instantly.',
  },
];

export default function LandingPage() {
  return (
    <div className="font-[var(--font-display)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(43,63,224,0.05),transparent_50%)]" />
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Save up to 15% at checkout
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
            Never pay full price
            <br />
            <span style={{ color: '#2B3FE0' }}>at checkout again</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 font-[var(--font-body)]">
            Stashly automatically finds and stacks discounted gift cards at checkout,
            saving you money on every purchase at your favorite stores.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-base transition-all hover:shadow-xl hover:shadow-blue-200/50"
              style={{ backgroundColor: '#2B3FE0' }}
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-gray-700 font-semibold text-base border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-4">
            How it <span style={{ color: '#2B3FE0' }}>works</span>
          </h2>
          <p className="text-center text-gray-500 mb-16 font-[var(--font-body)]">Three steps to start saving.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#E8EAFF' }}
                >
                  <step.icon size={24} style={{ color: '#2B3FE0' }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-[var(--font-body)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported retailers */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Works at your <span style={{ color: '#2B3FE0' }}>favorite stores</span>
          </h2>
          <p className="text-gray-500 mb-12 font-[var(--font-body)]">And we&apos;re adding more every week.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {retailers.map(name => (
              <span
                key={name}
                className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24" style={{ backgroundColor: '#2B3FE0' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to start saving?</h2>
          <p className="text-blue-100 mb-8 font-[var(--font-body)]">
            Join thousands of shoppers who save money on every purchase.
          </p>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white font-semibold text-base transition-all hover:shadow-xl"
            style={{ color: '#2B3FE0' }}
          >
            Create Free Account
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
