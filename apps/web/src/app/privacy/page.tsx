import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Stashly',
  description: 'How Stashly collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">1. Information We Collect</h2>
          <p>
            <strong>Account Information:</strong> When you create an account, we collect your email address and encrypted password.
          </p>
          <p>
            <strong>Transaction Data:</strong> We record your gift card purchases, including retailer, amount, and savings. Gift card codes are encrypted at rest using AES-256-GCM.
          </p>
          <p>
            <strong>Browser Extension Data:</strong> Our Chrome extension detects checkout pages on supported retailers to offer savings. We do not collect browsing history, personal data from web pages, or any information from non-checkout pages.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process gift card purchases and deliver codes</li>
            <li>Track your savings and Stashly balances</li>
            <li>Display personalized savings at checkout via the extension</li>
            <li>Prevent fraud and abuse</li>
            <li>Improve our service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">3. Extension Permissions</h2>
          <p>The Stashly Chrome extension requests the following permissions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>activeTab:</strong> To detect checkout pages and read cart totals on supported retailers only</li>
            <li><strong>storage:</strong> To cache retailer configurations locally for performance</li>
            <li><strong>cookies:</strong> To maintain your authenticated session</li>
          </ul>
          <p>We only activate on supported retailer checkout pages. No data is collected from other websites.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">4. Data Storage & Security</h2>
          <p>
            All gift card codes are encrypted using AES-256-GCM before storage. Your password is hashed using bcrypt via Supabase Auth. We use HTTPS for all data transmission and Row Level Security (RLS) policies to ensure users can only access their own data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">5. Your Rights (CCPA/GDPR)</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data</li>
            <li>Export your data</li>
            <li>Delete your account and all associated data</li>
            <li>Opt out of non-essential data collection</li>
          </ul>
          <p>To exercise these rights, visit Settings or contact us at privacy@stashly.com.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">6. Third Parties</h2>
          <p>
            We use Supabase for authentication and database services. We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">7. Contact</h2>
          <p>Questions about this policy? Email us at privacy@stashly.com.</p>
        </section>
      </div>
    </div>
  );
}
