export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Terms of Service
      </h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">1. Service Description</h2>
          <p>
            Stashly is a platform that helps you save money at online checkout by purchasing discounted gift cards. Our Chrome extension detects when you&apos;re on a supported retailer&apos;s checkout page and offers relevant savings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">2. Gift Card Purchases</h2>
          <p>
            All gift card purchases are <strong>final and non-refundable</strong>. Once a gift card code is delivered, it cannot be returned or exchanged for cash. Gift cards are subject to the issuing retailer&apos;s terms and conditions.
          </p>
          <p>
            Stashly is not the issuer of gift cards. We are a reseller of discounted gift cards obtained through authorized channels.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">3. Stashly Balance</h2>
          <p>
            When a gift card purchase results in a balance exceeding your cart total, the residual amount is stored as a &quot;Stashly Balance&quot; for future use at the same retailer. Stashly Balances are not transferable between retailers and cannot be exchanged for cash.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">4. Prohibited Use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Reselling gift cards purchased through Stashly</li>
            <li>Using automated tools to make bulk purchases</li>
            <li>Creating multiple accounts to circumvent purchase limits</li>
            <li>Attempting to exploit pricing errors or system vulnerabilities</li>
            <li>Using the service for money laundering or fraudulent purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">5. Purchase Limits</h2>
          <p>
            To prevent fraud, we enforce daily spending limits per user per retailer. First-time purchases may be subject to a review period before codes are delivered. We reserve the right to adjust these limits at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">6. Account Suspension</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms, exhibit suspicious activity, or engage in abuse of the platform. Suspended accounts may forfeit any unredeemed Stashly Balances.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">7. Limitation of Liability</h2>
          <p>
            Stashly is provided &quot;as is&quot; without warranty. We are not liable for: gift cards that are rejected by retailers, retailer policy changes affecting gift card usage, service interruptions, or savings calculations that differ from actual checkout totals. Our total liability is limited to the amount you paid for the specific transaction in question.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">8. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of Stashly after changes constitutes acceptance of the new terms. We will notify you of significant changes via email.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">9. Contact</h2>
          <p>Questions about these terms? Email us at legal@stashly.com.</p>
        </section>
      </div>
    </div>
  );
}
