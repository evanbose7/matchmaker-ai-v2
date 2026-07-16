import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav.jsx";

const API = import.meta.env.VITE_API_URL || "";

const STYLES = ["Funny/Witty", "Genuine/Authentic", "Adventurous", "Intellectual", "Romantic", "Laid-back", "Ambitious", "Creative"];
const LOOKING_FOR = ["Serious relationship", "Casual dating", "New friends", "Open to possibilities", "Marriage-minded"];
const PLATFORMS = ["Tinder", "Bumble", "Hinge", "OkCupid"];

const CRITERIA = [
  { key: "faceVisibility", label: "Face Visibility" },
  { key: "imageQuality", label: "Image Quality" },
  { key: "expression", label: "Expression" },
  { key: "composition", label: "Composition" },
  { key: "authenticity", label: "Authenticity" },
  { key: "datingValue", label: "Dating Value" },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs text-accent2 hover:text-accent transition-colors flex-none"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

function PhotoRankResults({ rankedPhotos, varietyNote }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="mt-4">
      {varietyNote && (
        <div className="bg-black/20 rounded-xl p-3 mb-4 border border-white/08 text-muted text-xs leading-relaxed">
          {varietyNote}
        </div>
      )}
      <div className="space-y-3">
        {rankedPhotos.map((photo, idx) => (
          <div key={idx} className={`border rounded-xl overflow-hidden ${photo.rank === 1 ? "border-accent2/40" : "border-white/08"}`}>
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(expanded === idx ? null : idx)}>
              <img src={photo.preview} alt="" className="w-14 h-14 object-cover rounded-lg flex-none" />
              <div className="flex items-center gap-2 flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  photo.rank === 1 ? "bg-accent2/20 border-accent2 text-accent2" :
                  photo.rank === rankedPhotos.length ? "bg-red-400/10 border-red-400/40 text-red-400" :
                  "bg-white/08 border-white/20 text-muted"}`}>#{photo.rank}</div>
                <div>
                  <div className="text-ink text-sm font-semibold">Photo {photo.photoIndex}</div>
                  <div className="text-muted text-xs">{photo.rank === 1 ? "⭐ Best photo" : `Rank #${photo.rank}`}</div>
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className={`font-display text-xl ${photo.overall >= 7 ? "text-green-400" : photo.overall >= 5 ? "text-accent2" : "text-red-400"}`}>{photo.overall}</div>
                <div className="text-muted text-xs">/ 10</div>
              </div>
              <div className={`text-muted text-xs transition-transform ${expanded === idx ? "rotate-180" : ""}`}>▼</div>
            </div>
            {expanded === idx && (
              <div className="px-4 pb-4 border-t border-white/08 pt-3">
                <div className="space-y-2 mb-3">
                  {CRITERIA.map(c => (
                    <div key={c.key} className="flex items-center justify-between text-xs">
                      <span className="text-muted">{c.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-white/08 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(photo.scores[c.key] || 0) * 10}%`, background: photo.scores[c.key] >= 7 ? "#7ee0a8" : photo.scores[c.key] >= 5 ? "#ffc24b" : "#ff8a8a" }} />
                        </div>
                        <span className="text-ink font-bold w-4">{photo.scores[c.key]}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {photo.recommendation && (
                  <div className="bg-black/20 rounded-lg p-3 border border-white/08">
                    <div className="text-xs text-accent2 mb-1">Recommendation</div>
                    <p className="text-xs text-ink leading-relaxed">{photo.recommendation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BuilderPage() {
  const [form, setForm] = useState({
    name: "", age: "", profession: "", interests: "",
    lookingFor: "", funFact: "", platform: "Tinder",
  });
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Optional photo ranking
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState("");
  const [rankedPhotos, setRankedPhotos] = useState([]);
  const [varietyNote, setVarietyNote] = useState("");
  const inputRef = useRef();

  function toggleStyle(s) {
    setSelectedStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function addFiles(newFiles) {
    const valid = Array.from(newFiles).filter(f => f.type.startsWith("image/")).slice(0, 6 - files.length);
    if (!valid.length) return;
    setFiles(prev => [...prev, ...valid].slice(0, 6));
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))].slice(0, 6));
  }
  function removeFile(i) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleGenerate() {
    if (!form.interests && !form.profession && !form.funFact) {
      setError("Fill in at least your interests, profession, or a fun fact.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/builder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, style: selectedStyles.join(", ") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate profile content");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRankPhotos() {
    if (files.length === 0) { setRankError("Upload at least one photo."); return; }
    setRankError("");
    setRankLoading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("photos", f));
      const res = await fetch(`${API}/api/rank-photos`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ranking failed");
      const sorted = [...data.photos].sort((a, b) => a.rank - b.rank);
      setRankedPhotos(sorted);
      setVarietyNote(data.varietyNote || "");
    } catch (err) {
      setRankError(err.message);
    } finally {
      setRankLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-ink">
      <Nav />
      <div className="max-w-[860px] mx-auto px-6 pb-20">

        {/* Hero */}
        <div className="pt-4 pb-10 text-center">
          <div className="text-accent2 text-xs font-semibold tracking-widest uppercase mb-4">
            100% free · no photos required
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-5">
            Write a <span className="text-accent italic">better</span> bio<br />
            in under a minute.
          </h1>
          <p className="text-muted text-lg max-w-lg mx-auto leading-relaxed">
            Answer a few quick questions. AI writes you 3 bio options, 5 prompt answers,
            and opening lines — all free, no upload needed.
          </p>
        </div>

        {!result ? (
          <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6 space-y-5">

            <div>
              <label className="text-sm font-semibold text-ink mb-1.5 block">Dating platform</label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => updateField("platform", p)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      form.platform === p ? "bg-accent text-white border-accent" : "border-white/15 text-muted hover:border-white/30"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-ink mb-1.5 block">Name (optional)</label>
                <input value={form.name} onChange={e => updateField("name", e.target.value)}
                  placeholder="e.g. Alex" className="w-full px-3.5 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink mb-1.5 block">Age (optional)</label>
                <input value={form.age} onChange={e => updateField("age", e.target.value)}
                  placeholder="e.g. 27" className="w-full px-3.5 py-2.5 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink mb-1.5 block">Profession</label>
              <input value={form.profession} onChange={e => updateField("profession", e.target.value)}
                placeholder="e.g. Software engineer, nurse, teacher..." className="w-full px-3.5 py-2.5 text-sm" />
            </div>

            <div>
              <label className="text-sm font-semibold text-ink mb-1.5 block">Interests & hobbies</label>
              <textarea value={form.interests} onChange={e => updateField("interests", e.target.value)}
                rows={3} placeholder="e.g. Rock climbing, cooking Italian food, terrible at karaoke but does it anyway..."
                className="w-full px-3.5 py-2.5 text-sm" />
            </div>

            <div>
              <label className="text-sm font-semibold text-ink mb-1.5 block">What are you looking for?</label>
              <div className="flex gap-2 flex-wrap">
                {LOOKING_FOR.map(l => (
                  <button key={l} onClick={() => updateField("lookingFor", l)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      form.lookingFor === l ? "bg-accent text-white border-accent" : "border-white/15 text-muted hover:border-white/30"
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink mb-1.5 block">Personality style (pick a few)</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button key={s} onClick={() => toggleStyle(s)}
                    className={`px-3 py-2 rounded-lg text-sm border text-left transition-all ${
                      selectedStyles.includes(s) ? "bg-accent/20 border-accent text-ink" : "border-white/15 text-muted hover:border-white/30"
                    }`}>
                    {selectedStyles.includes(s) ? "✓ " : ""}{s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink mb-1.5 block">One fun fact about you</label>
              <input value={form.funFact} onChange={e => updateField("funFact", e.target.value)}
                placeholder="e.g. I've been to 22 countries but never learned to swim" className="w-full px-3.5 py-2.5 text-sm" />
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className="w-full bg-gradient-to-br from-accent to-orange-400 text-white font-bold text-base py-4 rounded-xl disabled:opacity-50">
              {loading ? "Writing your profile..." : "Generate my profile →"}
            </button>
            {error && <p className="text-red-300 text-sm">{error}</p>}
          </div>
        ) : (
          <>
            {/* Bios */}
            <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
              <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">3 bio options</div>
              <div className="space-y-3">
                {result.bios.map((bio, i) => (
                  <div key={i} className="bg-black/20 rounded-xl p-4 border border-white/08">
                    <div className="flex justify-between items-start gap-3 mb-1">
                      <span className="text-xs text-muted">Option {i + 1}</span>
                      <CopyButton text={bio} />
                    </div>
                    <p className="text-ink text-sm leading-relaxed">{bio}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompts */}
            <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
              <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">Prompt suggestions</div>
              <div className="space-y-3">
                {result.prompts.map((p, i) => (
                  <div key={i} className="bg-black/20 rounded-xl p-4 border border-white/08">
                    <div className="flex justify-between items-start gap-3 mb-1">
                      <span className="text-muted text-xs">{p.question}</span>
                      <CopyButton text={p.answer} />
                    </div>
                    <p className="text-ink text-sm">{p.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opening lines */}
            <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
              <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">Opening lines</div>
              <div className="space-y-2">
                {result.openingLines.map((line, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-black/20 rounded-lg p-3 border border-white/08">
                    <p className="text-ink text-sm">{line}</p>
                    <CopyButton text={line} />
                  </div>
                ))}
              </div>
            </div>

            {/* Optional photo ranking */}
            <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
              <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-2">Photo ranking (optional)</div>
              <p className="text-muted text-sm mb-4">Upload your photos and AI will rank them best to worst — completely free.</p>

              {rankedPhotos.length === 0 ? (
                <>
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                    onClick={() => files.length < 6 && inputRef.current.click()}
                    className="border-2 border-dashed border-white/15 rounded-xl p-4 cursor-pointer hover:border-white/25 transition-all mb-4"
                  >
                    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => addFiles(e.target.files)} />
                    {previews.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-3xl mb-2">📸</div>
                        <div className="text-muted text-sm">Drop photos here or click to browse</div>
                        <div className="text-muted/60 text-xs mt-1">Up to 6 photos, optional</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {previews.map((src, i) => (
                          <div key={i} className="relative group aspect-square">
                            <img src={src} alt="" className="w-full h-full object-cover rounded-lg border border-white/10" />
                            <button onClick={e => { e.stopPropagation(); removeFile(i); }}
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ))}
                        {files.length < 6 && (
                          <div className="aspect-square border-2 border-dashed border-white/15 rounded-lg flex items-center justify-center text-muted text-xl">+</div>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={handleRankPhotos} disabled={rankLoading || files.length === 0}
                    className="bg-gradient-to-br from-accent to-orange-400 text-white font-bold text-sm px-6 py-3 rounded-xl disabled:opacity-50">
                    {rankLoading ? "Ranking..." : `Rank ${files.length || ""} photo${files.length !== 1 ? "s" : ""} →`}
                  </button>
                  {rankError && <p className="text-red-300 text-sm mt-3">{rankError}</p>}
                </>
              ) : (
                <PhotoRankResults rankedPhotos={rankedPhotos} varietyNote={varietyNote} />
              )}
            </div>

            {/* Upsell */}
            <div className="border border-accent2/30 bg-accent2/5 rounded-2xl p-7 mb-6">
              <div className="font-display text-xl text-ink mb-2">Want to know how a stranger actually sees your profile?</div>
              <p className="text-muted text-sm mb-5 leading-relaxed max-w-lg">
                The Full Audit analyzes your real screenshots — gives you a First Impression Score,
                identifies every red flag, and shows exactly what to fix. $4.99.
              </p>
              <Link to="/audit"
                className="inline-block bg-accent2 text-[#3a2300] font-bold text-sm px-6 py-3 rounded-xl">
                Get the Full Audit →
              </Link>
            </div>

            <button onClick={() => { setResult(null); setRankedPhotos([]); setFiles([]); setPreviews([]); }}
              className="text-muted text-sm hover:text-ink transition-colors block mx-auto">
              ← Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}
