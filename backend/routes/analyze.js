import express from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import Analysis from "../models/Analysis.js";
import { validateUploadedImages } from "../lib/validateImages.js";

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function buildPrompt(app, hasScreenshots, hasPhotos) {
  const context = [
    hasScreenshots && "profile screenshots (showing bio, prompts, layout)",
    hasPhotos && "actual profile photos",
  ].filter(Boolean).join(" and ");

  return `You are a dating profile expert analyzing someone's ${app || "dating"} profile. You have their ${context}.

Think about what happens when someone opens a dating app. They spend 1-3 seconds on the first photo forming subconscious impressions:
- Are they friendly?
- Do they seem confident?
- Does this feel genuine?
- Is this profile memorable?
- Did they put effort in?

Your job is to calculate a FIRST IMPRESSION SCORE — not an attractiveness score. Never comment on physical attractiveness.

STRICT RULES:
- The "improvements" array MUST contain EXACTLY 5 items — no more, no fewer. This is critical.
- Never comment on physical appearance or attractiveness under any circumstance.

SCORING CALIBRATION — use the full 1-10 range honestly:
- 9-10: Exceptional, rarely seen
- 7-8: Genuinely good, above average
- 5-6: Average, common issues present
- 3-4: Below average, multiple problems
- 1-2: Poor, major issues
Most profiles score between 4-7. A score of 8+ should be rare and genuinely earned. Do NOT cluster scores around 7-8 out of politeness. A bad profile should score 3-5, not 6-7.

Score these 6 dimensions (1-10):

1. FRIENDLINESS (20%) — Smile, relaxed expression, warm body language, open posture, approachability
2. CONFIDENCE (20%) — Posture, eye contact with camera, natural pose, self-assurance (not cockiness)
3. AUTHENTICITY (15%) — Heavy filters? AI edited? Over-staged? Genuine smile? Natural environment? Feels real?
4. PROFILE_EFFORT (15%) — Bio quality, photo variety, different settings, prompts filled thoughtfully — does this look like someone cared?
5. MEMORABILITY (15%) — After swiping 100 profiles, would this one stand out? Interesting locations, hobbies visible, pets, travel, unique composition?
6. VISUAL_APPEAL (15%) — Pure photography: lighting, sharpness, contrast, composition, colors. NOT attractiveness.

Calculate overall = (friendliness*0.20) + (confidence*0.20) + (authenticity*0.15) + (effort*0.15) + (memorability*0.15) + (visualAppeal*0.15)

Then write a human explanation like:
- 9.0+ = "Outstanding First Impression"
- 8.0-8.9 = "Excellent First Impression"  
- 7.0-7.9 = "Strong First Impression"
- 6.0-6.9 = "Good First Impression"
- 5.0-5.9 = "Average First Impression"
- below 5 = "Needs Work"

Respond with ONLY valid JSON, no markdown, no preamble:
{
  "firstImpression": {
    "overall": <one decimal, e.g. 8.4>,
    "label": "<e.g. Excellent First Impression>",
    "summary": "<2-3 sentence human explanation — what works, what the main gap is, one specific suggestion. Never mention attractiveness.>",
    "scores": {
      "friendliness": <1-10>,
      "confidence": <1-10>,
      "authenticity": <1-10>,
      "profileEffort": <1-10>,
      "memorability": <1-10>,
      "visualAppeal": <1-10>
    },
    "scoreNotes": {
      "friendliness": "<one short specific observation>",
      "confidence": "<one short specific observation>",
      "authenticity": "<one short specific observation>",
      "profileEffort": "<one short specific observation>",
      "memorability": "<one short specific observation>",
      "visualAppeal": "<one short specific observation>"
    }
  },
  "name": "<first name if visible, else null>",
  "age": "<age if visible, else null>",
  "strengths": ["<specific strength referencing what you actually see>", "<another>"],
  "redFlags": ["<specific red flag — no appearance comments>", "<another>", "<another>"],
  "improvements": ["<improvement 1 — specific and actionable>", "<improvement 2>", "<improvement 3>", "<improvement 4>", "<improvement 5>"],
  "rewrittenBio": "<extract their key traits (profession, hobbies, personality, humor) from what you see, then write a completely fresh hook. Do NOT repeat the opening sentence or structure of their original bio. Start differently. 2-4 sentences.>",
  "photoFeedback": [
    "<specific feedback on photo 1 — lighting, expression, background, vibe>",
    "<specific feedback on photo 2 if present>",
    "<specific feedback on photo 3 if present>"
  ],
  "mockup": {
    "name": "<their name or placeholder>",
    "age": "<age or placeholder>",
    "tagline": "<a compelling one-liner>",
    "bio": "<the rewritten bio>",
    "photoTips": [
      "<specific tip for photo 1>",
      "<specific tip for photo 2>",
      "<what a great 3rd photo would look like>"
    ],
    "prompts": [
      { "question": "<good prompt for this person>", "answer": "<compelling answer>" },
      { "question": "<another prompt>", "answer": "<another answer>" }
    ],
    "interests": ["<interest 1>", "<interest 2>", "<interest 3>", "<interest 4>", "<interest 5>"]
  }
}`;
}

function safeParseJSON(text) {
  return JSON.parse(
    text.trim()
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim()
  );
}

const uploadFields = upload.fields([
  { name: "screenshots", maxCount: 4 },
  { name: "photos", maxCount: 6 },
]);

router.post("/", uploadFields, async (req, res) => {
  try {
    const { sessionId, app } = req.body;
    const rawScreenshots = req.files?.screenshots || [];
    const rawPhotos = req.files?.photos || [];

    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
    const existing = await Analysis.findOne({ sessionId });
if (existing) {
  return res.status(429).json({ 
    error: "You've already used your free audit. Unlock the full results or start a new session.",
    analysisId: existing._id 
  });
}
    if (rawScreenshots.length + rawPhotos.length === 0) {
      return res.status(400).json({ error: "Upload at least one screenshot or photo" });
    }

    // Reject images that don't match what was asked for (random screenshots,
    // photos with no person in them, etc.) before spending a real analysis call on them.
    const validation = await validateUploadedImages(anthropic, { screenshots: rawScreenshots, photos: rawPhotos });
    const screenshots = rawScreenshots.filter((_, i) => validation.screenshots[i]?.valid !== false);
    const photos = rawPhotos.filter((_, i) => validation.photos[i]?.valid !== false);
    const rejectedScreenshots = validation.screenshots.filter(s => s.valid === false);
    const rejectedPhotos = validation.photos.filter(p => p.valid === false);

    if (rawScreenshots.length > 0 && screenshots.length === 0) {
      return res.status(400).json({
        error: "Those don't look like dating profile screenshots. Please upload a screenshot of your bio, interests, or prompts.",
        details: rejectedScreenshots.map(s => s.reason).filter(Boolean),
      });
    }
    if (rawPhotos.length > 0 && photos.length === 0) {
      return res.status(400).json({
        error: "Those don't look like photos of a person. Please upload your actual profile photos.",
        details: rejectedPhotos.map(p => p.reason).filter(Boolean),
      });
    }

    const allFiles = [...screenshots, ...photos];

    const imageBlocks = [];

    if (screenshots.length > 0) {
      imageBlocks.push({ type: "text", text: `--- PROFILE SCREENSHOTS (${screenshots.length}) ---` });
      screenshots.forEach((file, i) => {
        imageBlocks.push({ type: "text", text: `Screenshot ${i + 1}:` });
        imageBlocks.push({
          type: "image",
          source: { type: "base64", media_type: file.mimetype, data: file.buffer.toString("base64") },
        });
      });
    }

    if (photos.length > 0) {
      imageBlocks.push({ type: "text", text: `--- ACTUAL PROFILE PHOTOS (${photos.length}) ---` });
      photos.forEach((file, i) => {
        imageBlocks.push({ type: "text", text: `Photo ${i + 1}:` });
        imageBlocks.push({
          type: "image",
          source: { type: "base64", media_type: file.mimetype, data: file.buffer.toString("base64") },
        });
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: buildPrompt(app, screenshots.length > 0, photos.length > 0) },
          ],
        },
      ],
    });

    const text = response.content[0].text;
    const parsed = safeParseJSON(text);

    const record = await Analysis.create({
      sessionId,
      app: app || "unknown",
      firstImpression: parsed.firstImpression || null,
      score: Math.round((parsed.firstImpression?.overall || 0) * 10),
      scoreDesc: parsed.firstImpression?.label || "",
      strengths: parsed.strengths || [],
      redFlags: parsed.redFlags || [],
      improvements: parsed.improvements || [],
      rewrittenBio: parsed.rewrittenBio || "",
      mockup: JSON.stringify(parsed.mockup || {}),
      photos: photos.map(file => ({ data: file.buffer.toString("base64"), mimetype: file.mimetype })),
      photoFeedback: JSON.stringify(parsed.photoFeedback || null),
      name: parsed.name || null,
    });

    // Free preview includes full scores but not the notes (why behind each score)
    const freeImpression = {
      ...parsed.firstImpression,
      scoreNotes: undefined, // locked behind paywall
    };

    res.json({
      analysisId: record._id,
      firstImpression: freeImpression,
      strengths: record.strengths,
      redFlagsPreview: record.redFlags.slice(0, 1),
      redFlagsRemaining: Math.max(record.redFlags.length - 1, 0),
      photoFeedback: Array.isArray(parsed.photoFeedback)
        ? parsed.photoFeedback[0]
        : parsed.photoFeedback || null,
      name: parsed.name,
      paid: false,
      skippedImages: [...rejectedScreenshots, ...rejectedPhotos].length,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: "Could not complete the audit. Try again shortly." });
  }
});
router.get("/:analysisId", async (req, res) => {
  try {
    const record = await Analysis.findById(req.params.analysisId);
    if (!record) return res.status(404).json({ error: "Analysis not found" });

    const freeImpression = record.firstImpression
      ? { ...record.firstImpression.toObject(), scoreNotes: undefined }
      : null;

    let photoFeedback = null;
    try {
      const parsedFeedback = record.photoFeedback ? JSON.parse(record.photoFeedback) : null;
      photoFeedback = Array.isArray(parsedFeedback) ? parsedFeedback[0] : parsedFeedback;
    } catch { /* leave null if it doesn't parse */ }

    res.json({
      analysisId: record._id,
      app: record.app,
      firstImpression: freeImpression,
      strengths: record.strengths,
      redFlagsPreview: record.redFlags.slice(0, 1),
      redFlagsRemaining: Math.max(record.redFlags.length - 1, 0),
      photoFeedback,
      name: record.name,
      paid: record.paid,
    });
  } catch (err) {
    console.error("Fetch analysis error:", err);
    res.status(500).json({ error: "Could not load this analysis." });
  }
});
export default router;