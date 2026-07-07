import express from "express";
import puppeteer from "puppeteer";
import Analysis from "../models/Analysis.js";

const router = express.Router();

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

function generateHTML(record) {
  const fi = record.firstImpression || {};
  const scores = fi.scores || {};
  const notes = fi.scoreNotes || {};
  const overall = fi.overall || 0;
  const color = overallColor(overall);

  const dimensions = [
    { key: "friendliness",   label: "Friendliness",   icon: "😊", weight: "20%" },
    { key: "confidence",     label: "Confidence",     icon: "😎", weight: "20%" },
    { key: "authenticity",   label: "Authenticity",   icon: "✨", weight: "15%" },
    { key: "profileEffort",  label: "Profile Effort", icon: "📷", weight: "15%" },
    { key: "memorability",   label: "Memorability",   icon: "🎯", weight: "15%" },
    { key: "visualAppeal",   label: "Visual Appeal",  icon: "📸", weight: "15%" },
  ];

  const mockup = record.mockup ? JSON.parse(record.mockup) : {};
  const rankedPhotos = record.rankedPhotos ? JSON.parse(record.rankedPhotos) : [];

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (circumference * overall / 10);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0f0a0e;
    color: #f6ebe4;
    padding: 48px;
    width: 1000px;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(246,235,228,0.12);
    margin-bottom: 40px;
  }
  .logo { font-family: Georgia, serif; font-size: 28px; }
  .logo span { color: #ff6b5e; }
  .report-label { font-size: 12px; color: #c6a3b4; text-transform: uppercase; letter-spacing: 0.1em; }
  .date { font-size: 13px; color: #c6a3b4; margin-top: 4px; }

  /* Score section */
  .score-section {
    display: flex;
    align-items: center;
    gap: 40px;
    background: rgba(44,22,40,0.8);
    border: 1px solid rgba(246,235,228,0.12);
    border-radius: 20px;
    padding: 36px;
    margin-bottom: 32px;
  }
  .dial { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
  .dial svg { transform: rotate(-90deg); }
  .dial-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .dial-num { font-family: Georgia, serif; font-size: 36px; line-height: 1; }
  .dial-label { font-size: 11px; color: #c6a3b4; margin-top: 2px; }
  .score-info { flex: 1; }
  .score-tag { font-size: 11px; color: #ffc24b; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 8px; }
  .score-title { font-family: Georgia, serif; font-size: 28px; margin-bottom: 12px; }
  .score-summary { font-size: 14px; color: #c6a3b4; line-height: 1.6; }

  /* Section */
  .section { margin-bottom: 32px; }
  .section-title {
    font-size: 11px; color: #ffc24b; text-transform: uppercase;
    letter-spacing: 0.1em; font-weight: 700; margin-bottom: 16px;
    padding-bottom: 8px; border-bottom: 1px solid rgba(246,235,228,0.08);
  }

  /* Dimensions grid */
  .dimensions { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .dim-card {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(246,235,228,0.08);
    border-radius: 12px;
    padding: 16px;
  }
  .dim-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .dim-label { font-size: 14px; font-weight: 600; }
  .dim-score { font-family: Georgia, serif; font-size: 18px; }
  .dim-bar-bg { background: rgba(255,255,255,0.08); border-radius: 4px; height: 6px; margin-bottom: 8px; overflow: hidden; }
  .dim-bar { height: 100%; border-radius: 4px; }
  .dim-note { font-size: 12px; color: #c6a3b4; line-height: 1.4; }

  /* Lists */
  .list-item {
    display: flex; gap: 12px; padding: 10px 0;
    border-bottom: 1px dashed rgba(246,235,228,0.08);
    font-size: 14px; line-height: 1.5;
  }
  .list-item:last-child { border-bottom: none; }
  .list-icon { flex-shrink: 0; font-weight: 700; }
  .green { color: #7ee0a8; }
  .red { color: #ff8a8a; }
  .gold { color: #ffc24b; }

  /* Bio box */
  .bio-box {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(246,235,228,0.08);
    border-radius: 12px;
    padding: 20px;
    font-size: 14px;
    line-height: 1.7;
    font-style: italic;
    color: #f6ebe4;
  }

  /* Photo ranking */
  .photo-rank {
    display: flex; align-items: center; gap: 16px;
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(246,235,228,0.08);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 10px;
  }
  .rank-badge {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; flex-shrink: 0;
    border: 1.5px solid rgba(255,194,75,0.4);
    color: #ffc24b;
  }
  .rank-badge.top { background: rgba(255,194,75,0.15); }
  .rank-badge.low { border-color: rgba(255,138,138,0.4); color: #ff8a8a; background: rgba(255,138,138,0.08); }
  .photo-rank-info { flex: 1; }
  .photo-rank-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
  .photo-rank-rec { font-size: 12px; color: #c6a3b4; line-height: 1.4; }
  .photo-overall { font-family: Georgia, serif; font-size: 22px; }

  /* Footer */
  .footer {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid rgba(246,235,228,0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-logo { font-family: Georgia, serif; font-size: 16px; }
  .footer-logo span { color: #ff6b5e; }
  .footer-note { font-size: 11px; color: #c6a3b4; }

  .page-break { page-break-before: always; padding-top: 48px; }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div>
    <div class="logo">Match<span>Maker</span> AI</div>
    <div class="report-label">Profile Audit Report</div>
  </div>
  <div style="text-align:right">
    <div class="date">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    <div class="report-label" style="margin-top:4px">${record.app || "Tinder"} Profile</div>
  </div>
</div>

<!-- First Impression Score -->
<div class="score-section">
  <div class="dial">
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/>
      <circle cx="70" cy="70" r="52" fill="none" stroke="${color}" stroke-width="10"
        stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"/>
    </svg>
    <div class="dial-inner">
      <div class="dial-num" style="color:${color}">${overall.toFixed(1)}</div>
      <div class="dial-label">/ 10</div>
    </div>
  </div>
  <div class="score-info">
    <div class="score-tag">First Impression Score</div>
    <div class="score-title">${fi.label || "—"}</div>
    <div class="score-summary">${fi.summary || ""}</div>
  </div>
</div>

<!-- Dimension Breakdown -->
<div class="section">
  <div class="section-title">Breakdown</div>
  <div class="dimensions">
    ${dimensions.map(d => {
      const score = scores[d.key] || 0;
      const pct = score * 10;
      const c = scoreColor(score);
      const note = notes[d.key] || "";
      return `
      <div class="dim-card">
        <div class="dim-header">
          <div class="dim-label">${d.icon} ${d.label} <span style="color:#c6a3b4;font-size:11px;font-weight:400">${d.weight}</span></div>
          <div class="dim-score" style="color:${c}">${score}/10</div>
        </div>
        <div class="dim-bar-bg"><div class="dim-bar" style="width:${pct}%;background:${c}"></div></div>
        ${note ? `<div class="dim-note">${note}</div>` : ""}
      </div>`;
    }).join("")}
  </div>
</div>

<!-- Strengths -->
<div class="section">
  <div class="section-title">What's Working</div>
  ${(record.strengths || []).map(s => `
  <div class="list-item">
    <span class="list-icon green">+</span>
    <span>${s}</span>
  </div>`).join("")}
</div>

<!-- Red Flags -->
<div class="section">
  <div class="section-title">Red Flags</div>
  ${(record.redFlags || []).map(f => `
  <div class="list-item">
    <span class="list-icon red">!</span>
    <span>${f}</span>
  </div>`).join("")}
</div>

<!-- Improvements -->
<div class="section">
  <div class="section-title">${(record.improvements || []).length} Specific Improvements</div>
  ${(record.improvements || []).map((s, i) => `
  <div class="list-item">
    <span class="list-icon gold">${i + 1}.</span>
    <span>${s}</span>
  </div>`).join("")}
</div>

<!-- Rewritten Bio -->
<div class="section">
  <div class="section-title">Rewritten Bio</div>
  <div class="bio-box">${record.rewrittenBio || "—"}</div>
</div>

${rankedPhotos.length > 0 ? `
<!-- Photo Ranking -->
<div class="section page-break">
  <div class="section-title">Photo Rankings</div>
  ${rankedPhotos.map((p, i) => `
  <div class="photo-rank">
    <div class="rank-badge ${p.rank === 1 ? "top" : p.rank === rankedPhotos.length ? "low" : ""}">
      #${p.rank}
    </div>
    <div class="photo-rank-info">
      <div class="photo-rank-title">Photo ${p.photoIndex}${p.rank === 1 ? " ⭐ Best photo" : ""}</div>
      <div class="photo-rank-rec">${p.recommendation || ""}</div>
    </div>
    <div class="photo-overall" style="color:${scoreColor(p.overall)}">${p.overall}</div>
  </div>`).join("")}
</div>` : ""}

${mockup && mockup.bio ? `
<!-- Profile Mockup -->
<div class="section">
  <div class="section-title">Your Optimised Profile</div>
  <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(246,235,228,0.08);border-radius:16px;padding:24px;">
    <div style="font-family:Georgia,serif;font-size:22px;margin-bottom:4px">${mockup.name || "—"}, ${mockup.age || "—"}</div>
    ${mockup.tagline ? `<div style="color:#ffc24b;font-size:13px;font-style:italic;margin-bottom:12px">"${mockup.tagline}"</div>` : ""}
    <div style="font-size:14px;line-height:1.6;color:#f6ebe4;margin-bottom:16px">${mockup.bio || ""}</div>
    ${mockup.interests && mockup.interests.length > 0 ? `
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
      ${mockup.interests.map(t => `<span style="background:rgba(255,255,255,0.08);border:1px solid rgba(246,235,228,0.15);color:#f6ebe4;font-size:12px;padding:4px 10px;border-radius:20px">${t}</span>`).join("")}
    </div>` : ""}
    ${mockup.prompts && mockup.prompts.length > 0 ? `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${mockup.prompts.map(p => `
      <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(246,235,228,0.08);border-radius:10px;padding:12px">
        <div style="font-size:11px;color:#c6a3b4;margin-bottom:4px">${p.question}</div>
        <div style="font-size:13px">${p.answer}</div>
      </div>`).join("")}
    </div>` : ""}
  </div>
</div>` : ""}

<!-- Footer -->
<div class="footer">
  <div class="footer-logo">Match<span>Maker</span> AI</div>
  <div class="footer-note">This report is generated by AI and is for guidance only.</div>
</div>

</body>
</html>`;
}

// GET /api/report/:analysisId
router.get("/:analysisId", async (req, res) => {
  try {
    const record = await Analysis.findById(req.params.analysisId);
    if (!record) return res.status(404).json({ error: "Analysis not found" });
    if (!record.paid) return res.status(402).json({ error: "Payment required" });

    const html = generateHTML(record);
    
    const browser = await puppeteer.launch({
  headless: true,
  executablePath:
    process.env.NODE_ENV === "production"
      ? undefined
      : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ],
});



 

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
    });

    await browser.close();

    const name = record.firstImpression?.label
      ? `matchmaker-report-${record.firstImpression.label.replace(/\s+/g, "-").toLowerCase()}.pdf`
      : "matchmaker-report.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    res.send(pdf);
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ error: "Could not generate report. Try again shortly." });
  }
});

export default router;
