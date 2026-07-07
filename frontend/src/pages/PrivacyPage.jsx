import React from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav.jsx";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-ink">
      <Nav />
      <div className="max-w-[720px] mx-auto px-6 pb-20">
        <div className="pt-8 pb-12">
          <div className="text-accent2 text-xs font-semibold tracking-widest uppercase mb-3">Legal</div>
          <h1 className="font-display text-4xl mb-3">Privacy Policy</h1>
          <p className="text-muted text-sm">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div className="space-y-8 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="font-display text-lg text-ink mb-3">1. What we collect</h2>
            <p>When you use MatchMaker AI, we collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Images you upload (profile screenshots and photos)</li>
              <li>A random session ID stored in your browser's local storage</li>
              <li>Payment information processed securely by Razorpay (we never see or store your card details)</li>
              <li>The AI-generated analysis results associated with your session</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-ink mb-3">2. How we use your data</h2>
            <p>Your uploaded images are used solely to generate your profile audit. They are:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Sent to Claude AI (Anthropic) for analysis — subject to Anthropic's privacy policy</li>
              <li>Stored temporarily in our database to enable you to access your results</li>
              <li>Never sold, shared with third parties, or used for advertising</li>
              <li>Never used to train AI models</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-ink mb-3">3. Data retention</h2>
            <p>Your analysis results and uploaded images are stored for up to 30 days, after which they are automatically deleted. You can request immediate deletion by contacting us.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-ink mb-3">4. Payments</h2>
            <p>All payments are processed by Razorpay. We do not store any payment card details. Razorpay's privacy policy applies to payment processing.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-ink mb-3">5. Cookies and local storage</h2>
            <p>We store a single anonymous session ID in your browser's local storage to associate your audit with your session. We do not use tracking cookies or third-party analytics.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-ink mb-3">6. Your rights</h2>
            <p>You have the right to request access to, correction of, or deletion of your data at any time. Contact us and we will respond within 48 hours.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-ink mb-3">7. Contact</h2>
            <p>If you have any questions about this privacy policy or your data, please contact us at the email address listed on our website.</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/08 flex gap-6">
          <Link to="/" className="text-muted text-xs hover:text-ink transition-colors">← Back to home</Link>
          <Link to="/terms" className="text-muted text-xs hover:text-ink transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
