import React from "react";

export default function ScoreDial({ score }) {
  const circumference = 226;
  const s = Math.max(1, Math.min(100, Number(score) || 50));
  const offset = circumference - (circumference * s) / 100;
  const color = s >= 70 ? "#7ee0a8" : s >= 40 ? "#ffc24b" : "#ff6b5e";

  return (
    <div className="relative w-[84px] h-[84px] flex-none">
      <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
        <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx="42" cy="42" r="36" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-xl text-ink">
        {s}
      </div>
    </div>
  );
}
