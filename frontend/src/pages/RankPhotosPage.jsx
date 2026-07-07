import React, { useState, useRef } from "react";
import Nav from "../components/Nav.jsx";
import ProfileMockup from "../components/ProfileMockup.jsx";

const API = import.meta.env.VITE_API_URL || "";

const CRITERIA = [
  { key: "faceVisibility", label: "Face Visibility", weight: "20%" },
  { key: "imageQuality", label: "Image Quality", weight: "15%" },
  { key: "expression", label: "Expression", weight: "15%" },
  { key: "composition", label: "Composition", weight: "15%" },
  { key: "authenticity", label: "Authenticity", weight: "15%" },
  { key: "datingValue", label: "Dating Value", weight: "10%" },
];

function ScoreBar({ value }) {
  const color = value >= 8 ? "#7ee0a8" : value >= 6 ? "#ffc24b" : "#ff8a8a";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-white/08 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function RankBadge({ rank, total }) {
  const isTop = rank === 1;
  const isBottom = rank === total;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
      isTop ? "bg-accent2/20 border-accent2 text-accent2" :
      isBottom ? "bg-red-400/10 border-red-400/40 text-red-400" :
      "bg-white/08 border-white/20 text-muted"
    }`}>
      #{rank}
    </div>
  );
}

function OverallScore({ score }) {
  const color = score >= 8 ? "#7ee0a8" : score >= 6 ? "#ffc24b" : "#ff8a8a";
  return (
    <div className="text-3xl font-display" style={{ color }}>{score.toFixed(1)}</div>
  );
}

export default function RankPhotosPage() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const inputRef = useRef();

  function addFiles(newFiles) {
    const valid = Array.from(newFiles)
      .filter(f => f.type.startsWith("image/"))
      .slice(0, 10 - files.length);
    if (!valid.length) return;
    const updated = [...files, ...valid].slice(0, 10);
    setFiles(updated);
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))].slice(0, 10));
  }

  function removeFile(i) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleRank() {
    if (files.length === 0) { setError("Upload at least one photo."); return; }
    setError("");
    setLoading(true);
    setResults(null);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("photos", f));
      const res = await fetch(`${API}/api/rank-photos`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ranking failed");
      // Sort by rank
      data.photos.sort((a, b) => a.rank - b.rank);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-ink">
      <Nav />
      <div className="max-w-[900px] mx-auto px-6 pb-20">

        {/* Hero */}
        <div className="pt-4 pb-10 text-center">
          <div className="text-accent2 text-xs font-semibold tracking-widest uppercase mb-4">
            Photo ranking system
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-5">
            Which photo should be<br />
            your <span className="text-accent italic">main photo?</span>
          </h1>
          <p className="text-muted text-lg max-w-lg mx-auto leading-relaxed">
            Upload your dating profile photos. AI scores each one on 6 criteria
            and ranks them — no appearance judgments, just honest technical feedback.
          </p>
        </div>

        {/* Criteria pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CRITERIA.map(c => (
            <div key={c.key} className="bg-panel border border-white/10 text-xs px-3 py-1.5 rounded-full text-muted">
              {c.label} <span className="text-accent2">{c.weight}</span>
            </div>
          ))}
          <div className="bg-panel border border-white/10 text-xs px-3 py-1.5 rounded-full text-muted">
            Variety <span className="text-accent2">10%</span>
          </div>
        </div>

        {/* Upload */}
        {!results && (
          <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6">
            <div className="text-sm font-semibold text-ink mb-1">Upload your photos</div>
            <div className="text-xs text-muted mb-4">Upload 2–10 photos you're considering for your profile</div>

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              onClick={() => files.length < 10 && inputRef.current.click()}
              className="border-2 border-dashed border-white/15 rounded-xl p-5 cursor-pointer hover:border-white/25 transition-all"
            >
              <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => addFiles(e.target.files)} />

              {previews.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">📸</div>
                  <div className="text-muted text-sm">Drop photos here or click to browse</div>
                  <div className="text-muted/60 text-xs mt-1">Up to 10 photos</div>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img src={src} alt="" className="w-full h-full object-cover rounded-lg border border-white/10" />
                      <button
                        onClick={e => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {i + 1}
                      </div>
                    </div>
                  ))}
                  {files.length < 10 && (
                    <div className="aspect-square border-2 border-dashed border-white/15 rounded-lg flex items-center justify-center text-muted text-xl">
                      +
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-5 flex-wrap">
              <button onClick={handleRank} disabled={loading || files.length === 0}
                className="bg-gradient-to-br from-accent to-orange-400 text-white font-bold text-base px-7 py-3.5 rounded-xl disabled:opacity-50">
                {loading ? "Analyzing photos..." : `Rank ${files.length || ""} photo${files.length !== 1 ? "s" : ""} →`}
              </button>
              {files.length > 0 && !loading && (
                <span className="text-muted text-sm">{files.length} photo{files.length !== 1 ? "s" : ""} ready</span>
              )}
            </div>
            {error && <p className="text-red-300 text-sm mt-3">{error}</p>}
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            {/* Summary */}
            <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6">
              <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-3">Overall assessment</div>
              <p className="text-ink text-sm leading-relaxed mb-4">{results.summary}</p>

              <div className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/08">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="text-xs text-muted uppercase tracking-wider mb-1">Best photo for main</div>
                  <div className="text-ink text-sm font-semibold">Photo {results.topPick}</div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs text-muted mb-1">Variety</div>
                    <div className={`text-lg font-bold ${results.varietyScore >= 7 ? "text-green-400" : results.varietyScore >= 5 ? "text-accent2" : "text-red-400"}`}>
                      {results.varietyScore}/10
                    </div>
                  </div>
                </div>
              </div>
              {results.varietyNote && (
                <p className="text-muted text-xs mt-3 leading-relaxed">{results.varietyNote}</p>
              )}
            </div>

            {/* Ranked photos */}
            <div className="space-y-4">
              {results.photos.map((photo, idx) => (
                <div key={idx} className={`bg-panel border rounded-2xl overflow-hidden transition-all ${
                  photo.rank === 1 ? "border-accent2/40" : "border-white/10"
                }`}>
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer"
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                  >
                    {/* Photo thumbnail */}
                    <div className="relative flex-none">
                      <img src={photo.preview} alt=""
                        className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                      {photo.rank === 1 && (
                        <div className="absolute -top-1.5 -right-1.5 text-sm">⭐</div>
                      )}
                    </div>

                    {/* Rank + name */}
                    <div className="flex items-center gap-3 flex-none">
                      <RankBadge rank={photo.rank} total={results.photos.length} />
                      <div>
                        <div className="text-ink text-sm font-semibold">Photo {photo.photoIndex}</div>
                        <div className="text-muted text-xs">
                          {photo.rank === 1 ? "Best photo" : photo.rank === results.photos.length ? "Weakest photo" : `Rank #${photo.rank}`}
                        </div>
                      </div>
                    </div>

                    {/* Overall score */}
                    <div className="ml-auto text-right">
                      <OverallScore score={photo.overall} />
                      <div className="text-muted text-xs">overall</div>
                    </div>

                    {/* Expand arrow */}
                    <div className={`text-muted text-xs transition-transform ${expanded === idx ? "rotate-180" : ""}`}>▼</div>
                  </div>

                  {/* Expanded detail */}
                  {expanded === idx && (
                    <div className="px-5 pb-5 border-t border-white/08 pt-4">
                      <div className="grid md:grid-cols-2 gap-6">

                        {/* Left: scores */}
                        <div>
                          <div className="text-xs text-muted uppercase tracking-wider mb-3">Breakdown</div>
                          <div className="space-y-3">
                            {CRITERIA.map(c => (
                              <div key={c.key}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted">{c.label}</span>
                                  <span className="text-muted">{c.weight}</span>
                                </div>
                                <ScoreBar value={photo.scores[c.key]} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: feedback */}
                        <div>
                          {photo.highlights && photo.highlights.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-muted uppercase tracking-wider mb-2">What works</div>
                              {photo.highlights.map((h, i) => (
                                <div key={i} className="flex gap-2 text-sm text-ink mb-1.5">
                                  <span className="text-green-400 flex-none">✓</span>{h}
                                </div>
                              ))}
                            </div>
                          )}

                          {photo.issues && photo.issues.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-muted uppercase tracking-wider mb-2">Issues</div>
                              {photo.issues.map((issue, i) => (
                                <div key={i} className="flex gap-2 text-sm text-muted mb-1.5">
                                  <span className="text-accent flex-none">·</span>{issue}
                                </div>
                              ))}
                            </div>
                          )}

                          {photo.recommendation && (
                            <div className="bg-black/20 rounded-xl p-4 border border-white/08">
                              <div className="text-xs text-accent2 uppercase tracking-wider mb-2">Recommendation</div>
                              <p className="text-sm text-ink leading-relaxed">{photo.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Redo button */}
            <div className="mt-8 text-center">
              <button onClick={() => { setResults(null); setFiles([]); setPreviews([]); }}
                className="text-muted text-sm hover:text-ink transition-colors underline">
                ← Rank different photos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
