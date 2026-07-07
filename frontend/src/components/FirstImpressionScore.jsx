import React from "react";

const DIMENSIONS = [
  { key: "friendliness",   label: "Friendliness",    icon: "😊", weight: "20%", desc: "Smile, warmth, approachability" },
  { key: "confidence",     label: "Confidence",      icon: "😎", weight: "20%", desc: "Posture, eye contact, natural pose" },
  { key: "authenticity",   label: "Authenticity",    icon: "✨", weight: "15%", desc: "Genuine, unfiltered, feels real" },
  { key: "profileEffort",  label: "Profile Effort",  icon: "📷", weight: "15%", desc: "Bio quality, photo variety, prompts" },
  { key: "memorability",   label: "Memorability",    icon: "🎯", weight: "15%", desc: "Would you remember this profile?" },
  { key: "visualAppeal",   label: "Visual Appeal",   icon: "📸", weight: "15%", desc: "Lighting, composition, colors" },
];

function scoreColor(s) {
  if (s >= 8) return "#7ee0a8";
  if (s >= 6) return "#ffc24b";
  return "#ff8a8a";
}

function overallColor(s) {
  if (s >= 8) return "#7ee0a8";
  if (s >= 6.5) return "#ffc24b";
  return "#ff8a8a";
}

function ScoreRing({ score }) {
  const s = Number(score) || 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const fill = circ - (circ * s / 10);
  const color = overallColor(s);
  return (
    <div className="relative flex-none" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={fill}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display" style={{ fontSize: 28, color, lineHeight: 1 }}>{s.toFixed(1)}</span>
        <span className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>/ 10</span>
      </div>
    </div>
  );
}

function DimensionBar({ dim, score, note, unlocked }) {
  const pct = (score / 10) * 100;
  const color = scoreColor(score);
  return (
    <div className="rounded-xl border border-white/08 bg-black/20 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>{dim.icon}</span>
            <div>
              <span className="text-ink text-sm font-semibold">{dim.label}</span>
              <span className="text-muted text-xs ml-2">{dim.weight}</span>
            </div>
          </div>
          <span className="font-display text-lg" style={{ color }}>{score}/10</span>
        </div>

        {/* Score bar — always visible */}
        <div className="mb-2">
          <div className="bg-white/08 rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>

        {/* Note — only in paid */}
        {unlocked && note && (
          <p className="text-muted text-xs leading-relaxed">{note}</p>
        )}
        {!unlocked && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-3 rounded bg-white/05" style={{ filter: "blur(2px)" }} />
            <span className="text-xs text-accent2/70">unlock to see why</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FirstImpressionScore({ data, unlocked }) {
  if (!data) return null;
  const { overall, label, summary, scores, scoreNotes } = data;

  return (
    <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
      {/* Header — always visible */}
      <div className="flex items-start gap-6 pb-6 border-b border-white/10 mb-6">
        <ScoreRing score={overall} />
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-1">First Impression Score</div>
          <div className="font-display text-2xl text-ink mb-2">{label}</div>
          <p className="text-muted text-sm leading-relaxed">{summary}</p>
        </div>
      </div>

      {/* All 6 dimensions — scores always visible, notes locked */}
      <div className="text-xs uppercase tracking-widest text-muted font-bold mb-3">Breakdown</div>
      <div className="space-y-3">
        {DIMENSIONS.map(dim => (
          <DimensionBar
            key={dim.key}
            dim={dim}
            score={scores?.[dim.key] || 0}
            note={scoreNotes?.[dim.key]}
            unlocked={unlocked}
          />
        ))}
      </div>

      {!unlocked && (
        <p className="text-muted text-xs text-center mt-4">
          Unlock to see the specific reason behind each score
        </p>
      )}
    </div>
  );
}
