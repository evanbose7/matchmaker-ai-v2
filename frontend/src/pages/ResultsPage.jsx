import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import Nav from "../components/Nav.jsx";
import FirstImpressionScore from "../components/FirstImpressionScore.jsx";
import ProfileMockup from "../components/ProfileMockup.jsx";

const API = import.meta.env.VITE_API_URL || "";

function InlinePhotoRanker({ onRanked }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  function addFiles(newFiles) {
    const valid = Array.from(newFiles).filter(f => f.type.startsWith("image/")).slice(0, 10 - files.length);
    if (!valid.length) return;
    setFiles(prev => [...prev, ...valid].slice(0, 10));
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
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("photos", f));
      const res = await fetch(`${API}/api/rank-photos`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ranking failed");
      // Sort by rank and pass up
      const sorted = [...data.photos].sort((a, b) => a.rank - b.rank);
      onRanked(sorted, data.varietyNote, data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6">
      <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-2">Photo Ranking</div>
      <p className="text-muted text-sm mb-5 leading-relaxed">
        Upload your profile photos — AI will rank them and display them in the correct order in your profile mockup below.
      </p>

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onClick={() => files.length < 10 && inputRef.current.click()}
        className="border-2 border-dashed border-white/15 rounded-xl p-4 cursor-pointer hover:border-white/25 transition-all mb-4"
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => addFiles(e.target.files)} />

        {previews.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">📸</div>
            <div className="text-muted text-sm">Drop your photos here or click to browse</div>
            <div className="text-muted/60 text-xs mt-1">Up to 10 photos</div>
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative group aspect-square">
                <img src={src} alt="" className="w-full h-full object-cover rounded-lg border border-white/10" />
                <button onClick={e => { e.stopPropagation(); removeFile(i); }}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded-full">{i + 1}</div>
              </div>
            ))}
            {files.length < 10 && (
              <div className="aspect-square border-2 border-dashed border-white/15 rounded-lg flex items-center justify-center text-muted text-xl">+</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleRank} disabled={loading || files.length === 0}
          className="bg-gradient-to-br from-accent to-orange-400 text-white font-bold text-sm px-6 py-3 rounded-xl disabled:opacity-50">
          {loading ? "Ranking photos..." : `Rank ${files.length || ""} photo${files.length !== 1 ? "s" : ""} →`}
        </button>
        {files.length > 0 && !loading && (
          <span className="text-muted text-xs">{files.length} photo{files.length !== 1 ? "s" : ""} ready</span>
        )}
      </div>
      {loading && (
  <div className="mt-4">
    <div className="flex justify-between text-xs text-muted mb-1">
      <span>AI is analyzing your photos...</span>
      <span>This takes 15-30 seconds</span>
    </div>
    <div className="w-full bg-white/08 rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
        style={{ animation: "progress 20s linear forwards" }} />
    </div>
  </div>
)}

      {error && <p className="text-red-300 text-sm mt-3">{error}</p>}
    </div>
  );
}

function PhotoRankResults({ rankedPhotos, varietyNote }) {
  const [expanded, setExpanded] = useState(null);

  const CRITERIA = [
    { key: "faceVisibility", label: "Face Visibility" },
    { key: "imageQuality", label: "Image Quality" },
    { key: "expression", label: "Expression" },
    { key: "composition", label: "Composition" },
    { key: "authenticity", label: "Authenticity" },
    { key: "datingValue", label: "Dating Value" },
  ];

  return (
    <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6">
      <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">Photo Rankings</div>

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
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted uppercase tracking-wider mb-2">Scores</div>
                    <div className="space-y-2">
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
                  </div>
                  <div>
                    {photo.highlights?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1">Works well</div>
                        {photo.highlights.map((h, i) => <div key={i} className="text-xs text-ink flex gap-2 mb-1"><span className="text-green-400">+</span>{h}</div>)}
                      </div>
                    )}
                    {photo.issues?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1">Issues</div>
                        {photo.issues.map((issue, i) => <div key={i} className="text-xs text-muted flex gap-2 mb-1"><span className="text-accent">·</span>{issue}</div>)}
                      </div>
                    )}
                    {photo.recommendation && (
                      <div className="bg-black/20 rounded-lg p-3 border border-white/08">
                        <div className="text-xs text-accent2 mb-1">Recommendation</div>
                        <p className="text-xs text-ink leading-relaxed">{photo.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { analysisId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const justPaid = searchParams.get("paid") === "1";
  const app = location.state?.app || "Dating App";

  const [data, setData] = useState(location.state?.preview || null);
  const [unlocked, setUnlocked] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(justPaid);
  const [loadingInitial, setLoadingInitial] = useState(!location.state?.preview && !justPaid);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [rankedPhotos, setRankedPhotos] = useState([]);
  const [varietyNote, setVarietyNote] = useState("");
  const [autoRanking, setAutoRanking] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [localizedPrice, setLocalizedPrice] = useState({ currency: "USD", display: "$4.99" });

  // Detect the customer's currency (via IP geolocation) and fetch the
  // localized price so the unlock card + Razorpay checkout both show it.
  useEffect(() => {
    let cancelled = false;
    async function detectAndLoadPrice() {
      let currency = "USD";
      try {
        const geo = await fetch("https://ipwho.is/").then(r => r.json());
        if (geo?.currency?.code) currency = geo.currency.code;
      } catch { /* IP lookup failed — just use USD */ }
      try {
        const price = await fetch(`${API}/api/payments/localized-price?currency=${currency}`).then(r => r.json());
        if (!cancelled && price?.currency) setLocalizedPrice(price);
      } catch { /* keep the $4.99 default */ }
    }
    detectAndLoadPrice();
    return () => { cancelled = true; };
  }, []);

  // Load the analysis by ID whenever we don't already have it from router
  // navigation state — covers page refresh, saved links, back button, etc.
  useEffect(() => {
    if (location.state?.preview || justPaid) return; // already have data, or the payment-poll effect handles it
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API}/api/analyze/${analysisId}`);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) { setNotFound(true); return; }

        if (body.paid) {
          const full = await fetch(`${API}/api/payments/unlock/${analysisId}`).then(r => r.json());
          if (cancelled) return;
          if (full.paid) { setData(full); setUnlocked(true); return; }
        }
        setData(body);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId]);

  useEffect(() => {
    if (!justPaid) return;
    let cancelled = false;
    let attempts = 0;
    async function poll() {
      attempts++;
      try {
        const res = await fetch(`${API}/api/payments/unlock/${analysisId}`);
        const full = await res.json();
        if (cancelled) return;
        if (res.ok && full.paid) {
          setData(full);
          setUnlocked(true);
          setWaitingForPayment(false);
          return;
        }
      } catch {}
      if (attempts < 8) setTimeout(poll, 1200);
      else if (!cancelled) {
        setWaitingForPayment(false);
        setError("Payment processing — refresh in a few seconds.");
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [justPaid, analysisId]);

  useEffect(() => {
    if (!unlocked || !data || manualOverride) return;
    if (rankedPhotos.length > 0) return;

    if (Array.isArray(data.rankedPhotos) && data.rankedPhotos.length > 0) {
      setRankedPhotos([...data.rankedPhotos].sort((a, b) => a.rank - b.rank));
      setVarietyNote(data.varietyNote || "");
      return;
    }

    if (data.hasStoredPhotos) {
      autoRankStoredPhotos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, data, manualOverride]);

  async function autoRankStoredPhotos() {
    setAutoRanking(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/rank-photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId }),
      });
      const rdata = await res.json();
      if (!res.ok) throw new Error(rdata.error || "Ranking failed");
      const sorted = [...rdata.photos].sort((a, b) => a.rank - b.rank);
      setRankedPhotos(sorted);
      setVarietyNote(rdata.varietyNote || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setAutoRanking(false);
    }
  }

  async function handleUnlock() {
    setCheckingOut(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, currency: localizedPrice.currency }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not create order");
      await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = resolve; s.onerror = reject;
        document.body.appendChild(s);
      });
      const rzp = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency,
        name: "MatchMaker AI", description: "Full Profile Audit",
        order_id: order.orderId,
        handler: async (response) => {
          const v = await fetch(`${API}/api/payments/verify`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, analysisId }),
          }).then(r => r.json());
          if (v.success) {
            const full = await fetch(`${API}/api/payments/unlock/${analysisId}`).then(r => r.json());
            if (full.paid) { setData(full); setUnlocked(true); }
          } else { setError("Payment verification failed."); }
        },
        prefill: {}, theme: { color: "#ff6b5e" },
        modal: { ondismiss: () => setCheckingOut(false) },
      });
      rzp.open();
    } catch (err) { setError(err.message); setCheckingOut(false); }
  }

  function handlePhotosRanked(sorted, note) {
    setRankedPhotos(sorted);
    setVarietyNote(note);
    setManualOverride(false);
  }

  if (waitingForPayment) {
    return (
      <div className="min-h-screen text-ink flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="font-display text-xl mb-2">Confirming your payment...</div>
          <div className="text-muted text-sm">Just a second.</div>
        </div>
      </div>
    );
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen text-ink flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="font-display text-xl mb-2">Loading your results...</div>
        </div>
      </div>
    );
  }

  if (!data || notFound) {
    return (
      <div className="min-h-screen text-ink flex items-center justify-center">
        <div className="text-center text-muted">No results found. <Link to="/" className="text-accent underline">Run a new audit</Link></div>
      </div>
    );
  }

  const fi = data.firstImpression;
  const mockupData = data.mockup
    ? (typeof data.mockup === "string" ? JSON.parse(data.mockup) : data.mockup)
    : null;

  return (
    <div className="min-h-screen text-ink">
      <Nav />
      <div className="max-w-[860px] mx-auto px-6 pb-20">

        <FirstImpressionScore data={fi} unlocked={unlocked} />

        <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
          <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">What's working</div>
          <ul>
            {(data.strengths || []).map((s, i) => (
              <li key={i} className="py-2.5 text-sm border-b border-dashed border-white/10 last:border-0 flex gap-3">
                <span className="text-green-400 flex-none">+</span>{s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
          <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">
            {unlocked ? "All red flags" : "Red flags (free preview)"}
          </div>
          <ul>
            {(unlocked ? data.redFlags : data.redFlagsPreview || []).map((f, i) => (
              <li key={i} className="py-2.5 text-sm border-b border-dashed border-white/10 last:border-0 flex gap-3">
                <span className="text-red-400 flex-none">!</span>{f}
              </li>
            ))}
            {!unlocked && data.redFlagsRemaining > 0 && (
              <li className="py-2.5 text-sm opacity-40 flex gap-3">
                <span>!</span>{data.redFlagsRemaining} more — unlock to see
              </li>
            )}
          </ul>
        </div>

        {!unlocked && (
          <div className="border border-accent2/30 bg-accent2/5 rounded-2xl p-7 mb-6">
            <div className="font-display text-2xl text-ink mb-3">Unlock the full audit</div>
            <p className="text-muted text-sm mb-5 leading-relaxed max-w-lg">
              You can see your scores above — unlock to find out the specific reason behind each one,
              plus every red flag, 5 improvements, photo ranking, rewritten bio, and your Tinder-style profile mockup.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {["Why behind each score", "All red flags", "5 specific improvements", "Photo ranking system", "Rewritten bio in your voice", "Tinder-style profile mockup"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-ink">
                  <span className="text-accent2">✓</span>{f}
                </div>
              ))}
            </div>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="font-display text-4xl text-accent2">{localizedPrice.display}</span>
              <span className="text-muted text-sm">one-time · this profile</span>
            </div>
            <button onClick={handleUnlock} disabled={checkingOut}
              className="bg-accent2 text-[#3a2300] font-bold text-base px-7 py-3.5 rounded-xl disabled:opacity-50">
              {checkingOut ? "Opening payment..." : "Unlock full audit →"}
            </button>
            {error && <p className="text-red-300 text-sm mt-3">{error}</p>}
          </div>
        )}

        {unlocked && (
          <>
            <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
              <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">{data.improvements?.length || 5} Specific Improvements</div>
              <ul>
                {(data.improvements || []).map((s, i) => (
                  <li key={i} className="py-2.5 text-sm border-b border-dashed border-white/10 last:border-0 flex gap-3">
                    <span className="text-accent2 flex-none font-bold">{i + 1}.</span>{s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-panel border border-white/10 rounded-2xl p-7 mb-6">
              <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-3">Rewritten bio</div>
              <p className="text-ink text-sm leading-relaxed italic">{data.rewrittenBio}</p>
            </div>

            {/* Photo ranker inline */}
            {rankedPhotos.length === 0 ? (
              autoRanking ? (
                <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6 text-center text-muted text-sm">
                  Ranking your photos with AI…
                </div>
              ) : data.hasStoredPhotos && !manualOverride ? (
                <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6 text-center text-muted text-sm">
                  {error || "Preparing your photo ranking…"}
                </div>
              ) : (
                <InlinePhotoRanker onRanked={handlePhotosRanked} />
              )
            ) : (
              <>
                <PhotoRankResults rankedPhotos={rankedPhotos} varietyNote={varietyNote} />
                <button onClick={() => { setRankedPhotos([]); setManualOverride(true); }} className="text-muted text-xs underline mb-6 block">
                  ← Re-rank with different photos
                </button>
              </>
            )}

            {/* Profile mockup with ranked photos */}
            <ProfileMockup
              mockup={mockupData}
              app={app}
              rankedPhotos={rankedPhotos}
            />

            <div className="mt-8 flex flex-col items-center gap-4">
              <a
                href={`${API}/api/report/${analysisId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-panel border border-white/15 text-ink font-semibold text-sm px-6 py-3.5 rounded-xl hover:border-white/30 transition-all"
              >
                <span>📄</span>
                Download PDF Report
              </a>
              <Link to="/" className="text-muted text-sm hover:text-ink transition-colors">← Audit another profile</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}