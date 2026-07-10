import React from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav.jsx";

export default function ContactPage() {
  return (
    <div className="min-h-screen text-ink">
      <Nav />
      <div className="max-w-[720px] mx-auto px-6 pb-20">
        <div className="pt-8 pb-12">
          <div className="text-accent2 text-xs font-semibold tracking-widest uppercase mb-3">Get in touch</div>
          <h1 className="font-display text-4xl mb-3">Contact Us</h1>
          <p className="text-muted text-sm">We typically respond within 24-48 hours.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-panel border border-white/10 rounded-2xl p-7">
            <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">Email</div>
            <a href="mailto:healthify083@gmail.com"
              className="text-ink text-lg hover:text-accent transition-colors">
              healthify083@gmail.com
            </a>
            <p className="text-muted text-sm mt-2">For support, feedback, or any questions about MatchMaker AI.</p>
          </div>

          <div className="bg-panel border border-white/10 rounded-2xl p-7">
            <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">Common questions</div>
            <div className="space-y-4">
              {[
                { q: "I paid but can't see my full results", a: "Email us with your session details and we'll sort it out immediately." },
                { q: "I want a refund", a: "Contact us within 24 hours of purchase and we'll review your case." },
                { q: "The analysis seems wrong", a: "Send us the feedback and we'll look into it — we're always improving the AI." },
                { q: "I have a feature suggestion", a: "We'd love to hear it — email us anytime." },
              ].map((item, i) => (
                <div key={i} className="border-b border-white/08 pb-4 last:border-0 last:pb-0">
                  <div className="text-ink text-sm font-semibold mb-1">{item.q}</div>
                  <div className="text-muted text-sm">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/08 flex gap-6">
          <Link to="/" className="text-muted text-xs hover:text-ink transition-colors">← Back to home</Link>
          <Link to="/privacy" className="text-muted text-xs hover:text-ink transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-muted text-xs hover:text-ink transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}