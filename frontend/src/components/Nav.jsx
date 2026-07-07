import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Nav() {
  const { pathname } = useLocation();

  return (
    <nav className="max-w-[1040px] mx-auto px-6 py-6 flex items-center justify-between">
      <Link to="/" className="font-display text-xl text-ink">
        Match<span className="text-accent">Maker</span> AI
      </Link>

      <div className="flex items-center gap-1">
        <Link to="/"
          className={`text-sm px-4 py-2 rounded-full transition-all ${
            pathname === "/" ? "bg-white/10 text-ink" : "text-muted hover:text-ink"
          }`}>
          Profile Audit
        </Link>
        
      </div>
    </nav>
  );
}
