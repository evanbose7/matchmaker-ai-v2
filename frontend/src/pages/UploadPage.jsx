import React, { useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Nav from "../components/Nav.jsx";

const API = import.meta.env.VITE_API_URL || "";

const sessionId = (() => {
  let id = localStorage.getItem("mm_session_v2");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("mm_session_v2", id); }
  return id;
})();

const APPS = ["Tinder"];

const loadingMessages = [
  "Reading your profile...",
  "Analyzing your photos...",
  "Checking your bio...",
  "Identifying red flags...",
  "Building your profile mockup...",
];

function UploadZone({ label, hint, icon, files, previews, onAdd, onRemove, maxFiles }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  function addFiles(newFiles) {
    const valid = Array.from(newFiles)
      .filter(f => f.type.startsWith("image/"))
      .slice(0, maxFiles - files.length);
    if (valid.length > 0) onAdd(valid);
  }

  return (
    <div className="mb-6">
      <div className="text-sm font-semibold text-ink mb-1">{label}</div>
      <div className="text-xs text-muted mb-3">{hint}</div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => files.length < maxFiles && inputRef.current.click()}
        className={`border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all ${
          dragging ? "border-accent bg-accent/5" : "border-white/15 hover:border-white/25 bg-panel/50"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => addFiles(e.target.files)} />
        {previews.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-muted text-sm">Drop here or click to browse</div>
            <div className="text-muted/60 text-xs mt-1">Up to {maxFiles} images</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative group aspect-[3/4]">
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl border border-white/10" />
                <button onClick={e => { e.stopPropagation(); onRemove(i); }}
                  className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">{i + 1}</div>
              </div>
            ))}
            {files.length < maxFiles && (
              <div className="aspect-[3/4] border-2 border-dashed border-white/15 rounded-xl flex items-center justify-center text-muted text-xl hover:border-white/30 transition-all">+</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [screenshots, setScreenshots] = useState([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [app, setApp] = useState("Tinder");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [slowWarning, setSlowWarning] = useState(false);
  const [error, setError] = useState("");
  const [previousAnalysisId, setPreviousAnalysisId] = useState(null);
  const navigate = useNavigate();
  const msgInterval = useRef();
  const slowTimeout = useRef();

  function addScreenshots(newFiles) {
    const updated = [...screenshots, ...newFiles].slice(0, 4);
    setScreenshots(updated);
    setScreenshotPreviews([...screenshotPreviews, ...newFiles.map(f => URL.createObjectURL(f))].slice(0, 4));
  }
  function removeScreenshot(i) {
    setScreenshots(prev => prev.filter((_, idx) => idx !== i));
    setScreenshotPreviews(prev => prev.filter((_, idx) => idx !== i));
  }
  function addPhotos(newFiles) {
    const updated = [...photos, ...newFiles].slice(0, 6);
    setPhotos(updated);
    setPhotoPreviews([...photoPreviews, ...newFiles.map(f => URL.createObjectURL(f))].slice(0, 6));
  }
  function removePhoto(i) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (screenshots.length === 0 && photos.length === 0) {
      setError("Upload at least one screenshot or photo.");
      return;
    }
    setError("");
    setPreviousAnalysisId(null);
    setSlowWarning(false);
    setLoading(true);

    let msgIdx = 0;
    setLoadingMsg(loadingMessages[0]);
    msgInterval.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 1800);

    // Show slow warning after 30 seconds
    slowTimeout.current = setTimeout(() => {
      setSlowWarning(true);
    }, 30000);

    try {
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("app", app);
      screenshots.forEach(f => formData.append("screenshots", f));
      photos.forEach(f => formData.append("photos", f));

      const res = await fetch(`${API}/api/analyze`, { method: "POST", body: formData });
      const data = await res.json();

      // Handle session limit (429)
      if (res.status === 429) {
        setPreviousAnalysisId(data.analysisId || null);
        throw new Error("429");
      }

      if (!res.ok) throw new Error(data.error || "Analysis failed");
      navigate(`/results/${data.analysisId}`, { state: { preview: data, app } });
    } catch (err) {
      if (err.message === "429") {
        setError("429");
      } else {
        setError(err.message);
      }
    } finally {
      clearInterval(msgInterval.current);
      clearTimeout(slowTimeout.current);
      setLoading(false);
      setSlowWarning(false);
    }
  }

  const totalFiles = screenshots.length + photos.length;

  return (
    <div className="min-h-screen text-ink">
      <Nav />
      <div className="max-w-[860px] mx-auto px-6 pb-20">

        {/* Hero */}
        <div className="pt-4 pb-10 text-center">
          <div className="text-accent2 text-xs font-semibold tracking-widest uppercase mb-4">
            Upload → AI reads everything → rebuilt profile
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-5">
            Find out <span className="text-accent italic">exactly</span> why<br />
            you're not getting matches.
          </h1>
          <p className="text-muted text-lg max-w-lg mx-auto leading-relaxed">
            Upload your profile screenshots and actual photos. AI reads your bio, prompts,
            and analyzes every photo — then rebuilds your profile from scratch.
          </p>
        </div>

        {/* Upload zones */}
        <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6">
          <UploadZone
            label="Profile screenshots"
            hint="Screenshot your bio page, prompt answers, and interests — anything with text. AI will read it all."
            icon="📱"
            files={screenshots}
            previews={screenshotPreviews}
            onAdd={addScreenshots}
            onRemove={removeScreenshot}
            maxFiles={4}
          />
          <div className="border-t border-white/08 pt-6">
            <UploadZone
              label="Your profile photos"
              hint="Upload the actual photos you use on your profile. AI will give specific feedback on each one."
              icon="📸"
              files={photos}
              previews={photoPreviews}
              onAdd={addPhotos}
              onRemove={removePhoto}
              maxFiles={6}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={handleSubmit} disabled={loading || totalFiles === 0}
            className="bg-gradient-to-br from-accent to-orange-400 text-white font-bold text-base px-8 py-4 rounded-xl disabled:opacity-50 shadow-lg shadow-accent/20">
            {loading ? loadingMsg : "Audit my profile →"}
          </button>
          {totalFiles > 0 && !loading && (
            <span className="text-muted text-sm">
              {screenshots.length} screenshot{screenshots.length !== 1 ? "s" : ""} +{" "}
              {photos.length} photo{photos.length !== 1 ? "s" : ""} ready
            </span>
          )}
          {totalFiles === 0 && <span className="text-muted text-sm">Free preview · no signup needed</span>}
        </div>

        {/* Slow warning */}
        {slowWarning && loading && (
          <div className="mt-4 bg-panel border border-white/10 rounded-xl p-4 text-sm text-muted">
            ⏳ This is taking longer than usual — AI is working through your images. Hang tight, it should finish shortly.
          </div>
        )}

        {/* Error messages */}
        {error === "429" ? (
          <div className="mt-4 bg-panel border border-accent2/30 rounded-xl p-5">
            <div className="text-accent2 font-semibold text-sm mb-1">You've already used your free audit.</div>
            <p className="text-muted text-sm mb-3">Each session gets one free profile audit. You can unlock your full results from your previous audit.</p>
            <div className="flex gap-3 flex-wrap">
              {previousAnalysisId && (
                <Link to={`/results/${previousAnalysisId}`}
                  className="bg-accent2 text-[#3a2300] font-bold text-sm px-5 py-2.5 rounded-lg">
                  View my previous results →
                </Link>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem("mm_session_v2");
                  window.location.reload();
                }}
                className="border border-white/15 text-muted text-sm px-5 py-2.5 rounded-lg hover:border-white/30 transition-all">
                Start fresh (new session)
              </button>
            </div>
          </div>
        ) : error ? (
          <p className="text-red-300 text-sm mt-4">{error}</p>
        ) : null}

        {/* How it works */}
        <div className="mt-16 grid md:grid-cols-3 gap-5">
          {[
            { icon: "📱", title: "Screenshot your profile", desc: "Capture your bio, prompts, and interests. Up to 4 screenshots." },
            { icon: "📸", title: "Upload your photos", desc: "The actual photos you use. AI gives specific feedback on lighting, expression, and vibe for each one." },
            { icon: "✨", title: "Get your rebuilt profile", desc: "Score, red flags, improvements, photo-by-photo feedback, and a visual mockup of your optimized profile." },
          ].map((s, i) => (
            <div key={i} className="bg-panel border border-white/08 rounded-xl p-5">
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="font-display text-base text-ink mb-2">{s.title}</div>
              <div className="text-muted text-sm leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-6 border-t border-white/08 flex gap-6 justify-center">
          <Link to="/privacy" className="text-muted text-xs hover:text-ink transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-muted text-xs hover:text-ink transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
