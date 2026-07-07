import React, { useState } from "react";

export default function ProfileMockup({ mockup, app, rankedPhotos }) {
  const [expanded, setExpanded] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  if (!mockup) return null;

  const photos = rankedPhotos && rankedPhotos.length > 0
    ? rankedPhotos.map(p => p.preview)
    : [];

  const hasPhotos = photos.length > 0;

  return (
    <div className="mt-8">
      <div className="text-xs uppercase tracking-widest text-accent2 font-bold mb-4">
        Your improved profile — tap to expand
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative" style={{ width: 320, height: 640 }}>

          {/* Phone shell */}
          <div style={{
            width: 320, height: 640,
            background: "#111",
            borderRadius: 44,
            border: "7px solid #2a2a2a",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}>
            {/* Status bar */}
            <div style={{ background: "#111", padding: "10px 20px 2px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 600, fontFamily: "system-ui" }}>9:41</span>
              <span style={{ color: "#fff", fontSize: 11, fontFamily: "system-ui" }}>▪▪▪</span>
            </div>

            {/* Tinder nav */}
            <div style={{ background: "#fff", padding: "8px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "0.5px solid #eee" }}>
              <span style={{ fontSize: 18, color: "#ccc" }}>👤</span>
              <span style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg,#FE3C72,#FF6036)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "system-ui" }}>tinder</span>
              <span style={{ fontSize: 18, color: "#FE3C72" }}>💬</span>
            </div>

            {/* Card area */}
            <div style={{ flex: 1, background: "#f0f0f0", position: "relative", overflow: "hidden" }}>

              {/* Card behind */}
              <div style={{ position: "absolute", inset: "14px", borderRadius: 12, background: "#ccc", zIndex: 0 }} />
              <div style={{ position: "absolute", inset: "20px", borderRadius: 10, background: "#bbb", zIndex: -1 }} />

              {/* Main card */}
              <div
                onClick={() => setExpanded(true)}
                style={{ position: "absolute", inset: "8px", borderRadius: 14, background: "#222", overflow: "hidden", cursor: "pointer", zIndex: 1 }}
              >
                {/* Photo */}
                {hasPhotos ? (
                  <img src={photos[activePhoto]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>🧑</div>
                )}

                {/* Photo dots */}
                {hasPhotos && photos.length > 1 && (
                  <div style={{ position: "absolute", top: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4, zIndex: 3 }}>
                    {photos.map((_, i) => (
                      <div key={i} onClick={e => { e.stopPropagation(); setActivePhoto(i); }}
                        style={{ height: 3, width: i === activePhoto ? 28 : 18, borderRadius: 2, background: i === activePhoto ? "#fff" : "rgba(255,255,255,0.45)", transition: "all 0.2s", cursor: "pointer" }} />
                    ))}
                  </div>
                )}

                {/* Left / Right nav buttons */}
                {hasPhotos && photos.length > 1 && (
                  <>
                    <div
                      onClick={e => { e.stopPropagation(); setActivePhoto((activePhoto - 1 + photos.length) % photos.length); }}
                      style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", zIndex: 6, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1 }}>‹</span>
                    </div>
                    <div
                      onClick={e => { e.stopPropagation(); setActivePhoto((activePhoto + 1) % photos.length); }}
                      style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", zIndex: 6, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1 }}>›</span>
                    </div>
                  </>
                )}

                {/* Gradient */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.35) 65%, transparent)", zIndex: 2 }} />

                {/* Info overlay */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 14px 14px", zIndex: 4, color: "#fff", fontFamily: "system-ui" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, display: "flex", alignItems: "baseline", gap: 6 }}>
                    {mockup.name || "Your Name"}
                    <span style={{ fontSize: 20, fontWeight: 400 }}>{mockup.age || "—"}</span>
                    <span style={{ fontSize: 14 }}>✓</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>2 km away</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", marginTop: 5, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {mockup.bio}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {(mockup.interests || []).slice(0, 4).map((t, i) => (
                      <span key={i} style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 20 }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Tap hint */}
                <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, zIndex: 5 }}>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", animation: "bounce 1.2s ease-in-out infinite" }}>↑</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "system-ui" }}>tap to expand</span>
                </div>
              </div>

              {/* Expanded sheet */}
              {expanded && (
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "14px 14px 0 0", zIndex: 10, maxHeight: "85%", overflowY: "auto" }}>
                  <div style={{ width: 36, height: 4, background: "#ddd", borderRadius: 2, margin: "10px auto 0" }} />

                  {/* Photos in order */}
                  {hasPhotos ? (
                    photos.slice(0, 3).map((src, i) => (
                      <div key={i}>
                        {i === 0 && (
                          <div style={{ padding: "12px 16px 0", fontFamily: "system-ui" }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: "#111", display: "flex", alignItems: "baseline", gap: 6 }}>
                              {mockup.name || "Your Name"}
                              <span style={{ fontSize: 20, fontWeight: 400 }}>{mockup.age || "—"}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>2 km away</div>
                            <div style={{ fontSize: 11, color: "#2196F3", fontWeight: 600, marginTop: 2 }}>✓ Verified</div>
                            <div style={{ height: 0.5, background: "#eee", margin: "10px 0" }} />
                            <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 5 }}>About</div>
                            <div style={{ fontSize: 13, color: "#222", lineHeight: 1.55 }}>{mockup.bio}</div>
                            <div style={{ height: 0.5, background: "#eee", margin: "10px 0" }} />
                            <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 6 }}>Interests</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                              {(mockup.interests || []).map((t, j) => (
                                <span key={j} style={{ background: "#f5f5f5", border: "1px solid #e8e8e8", color: "#444", fontSize: 12, padding: "4px 10px", borderRadius: 20 }}>{t}</span>
                              ))}
                            </div>
                            <div style={{ height: 0.5, background: "#eee", margin: "10px 0" }} />
                          </div>
                        )}
                        {i > 0 && mockup.prompts && mockup.prompts[i - 1] && (
                          <div style={{ padding: "10px 16px", fontFamily: "system-ui" }}>
                            <div style={{ background: "#f9f9f9", border: "0.5px solid #eee", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                              <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{mockup.prompts[i - 1].question}</div>
                              <div style={{ fontSize: 13, color: "#222", lineHeight: 1.45 }}>{mockup.prompts[i - 1].answer}</div>
                            </div>
                            <div style={{ height: 0.5, background: "#eee", margin: "10px 0" }} />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "12px 16px", fontFamily: "system-ui" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{mockup.name || "Your Name"}, {mockup.age || "—"}</div>
                      <div style={{ height: 0.5, background: "#eee", margin: "10px 0" }} />
                      <div style={{ fontSize: 13, color: "#222", lineHeight: 1.55 }}>{mockup.bio}</div>
                    </div>
                  )}

                  {/* Prompts if no photos */}
                  {!hasPhotos && mockup.prompts && (
                    <div style={{ padding: "0 16px", fontFamily: "system-ui" }}>
                      <div style={{ height: 0.5, background: "#eee", margin: "10px 0" }} />
                      {mockup.prompts.map((p, i) => (
                        <div key={i} style={{ background: "#f9f9f9", border: "0.5px solid #eee", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{p.question}</div>
                          <div style={{ fontSize: 13, color: "#222", lineHeight: 1.45 }}>{p.answer}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div onClick={() => setExpanded(false)} style={{ textAlign: "center", padding: "12px", fontSize: 13, color: "#FE3C72", fontWeight: 600, cursor: "pointer", fontFamily: "system-ui" }}>
                    Close ↓
                  </div>
                </div>
              )}
            </div>

            {/* Action bar */}
            <div style={{ background: "#fff", padding: "8px 20px 14px", display: "flex", justifyContent: "space-around", alignItems: "center", flexShrink: 0 }}>
              {[["↩","#F5A623",38],["✕","#FE3C72",48],["★","#2196F3",42],["♥","#4CD964",48],["⚡","#9B59B6",38]].map(([icon, color, size], i) => (
                <div key={i} style={{ width: size, height: size, borderRadius: "50%", border: "1.5px solid #eee", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 40 ? 22 : 16, color, cursor: "pointer" }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Photo thumbnails */}
        {hasPhotos && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 320 }}>
            {photos.map((src, i) => (
              <div key={i} onClick={() => setActivePhoto(i)} style={{ position: "relative", cursor: "pointer" }}>
                <img src={src} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, border: i === activePhoto ? "2px solid #FE3C72" : "2px solid transparent", transition: "border-color 0.15s" }} />
                <div style={{ position: "absolute", top: -6, left: -6, width: 18, height: 18, borderRadius: "50%", background: i === 0 ? "#FE3C72" : "#666", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        )}
        {hasPhotos && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "system-ui", textAlign: "center" }}>
            Photos ordered by AI rank · tap to preview each one
          </p>
        )}
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}
