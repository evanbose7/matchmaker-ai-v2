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

function buildRankingPrompt(count) {
  return `You are a dating profile photo expert. You are analyzing ${count} photos uploaded by someone for their dating profile.

Score each photo on these criteria (be specific and objective — never say a photo is "ugly" or comment on attractiveness):

1. FACE_VISIBILITY (20%) — Is face clearly visible? Only one person? Eyes visible? Face size in frame?
2. IMAGE_QUALITY (15%) — Sharpness, lighting quality, resolution, noise, contrast
3. EXPRESSION (15%) — Genuine smile? Relaxed? Natural pose? Looking at camera? (NOT attractiveness)
4. COMPOSITION (15%) — Subject centered or rule of thirds? Background clutter? Good cropping?
5. AUTHENTICITY (15%) — Heavy filter? AI edit? Mirror/bathroom selfie? Staged looking?
6. DATING_VALUE (10%) — Does the photo tell something about this person beyond their appearance?
   - A clear, warm, high-quality portrait = 5/10 minimum (it still has value as a main photo)
   - A portrait + interesting background or setting = 6-7/10
   - Shows a hobby, activity, travel, pet, or personality = 7-9/10
   - Tells a compelling story on its own = 9-10/10
   IMPORTANT: A great portrait with no "story" should never score below 4. Dating Value is ADDITIVE bonus for context, not a penalty for being a portrait.

For VARIETY (10%) — compare ALL photos together. Are they all selfies? Same pose? Same location? Same expression?

For each photo give scores 1-10 for each criterion.
Calculate overall = (face*0.20) + (quality*0.15) + (expression*0.15) + (composition*0.15) + (authenticity*0.15) + (datingValue*0.10) + variety contribution.

Then rank photos from best to worst.

IMPORTANT RULES:
- Never say a photo looks "bad", "ugly", or comment on physical appearance
- Frame all feedback as technical/compositional observations
- Recommendations must be specific and actionable
- Variety score applies to the whole set, not individual photos
- Dating Value minimum is 4 for any clear photo of a person — it is a bonus score, not a penalty
- A technically excellent portrait (sharp, good lighting, clear face, genuine expression) should have overall >= 6.5 regardless of dating value

SCORING CALIBRATION — use the full 1-10 range honestly:
- 9-10: Exceptional photo, rarely seen
- 7-8: Genuinely good, above average
- 5-6: Average, common issues present
- 3-4: Below average, multiple problems
- 1-2: Poor quality, major issues
Most photos score between 4-7. A score of 8+ should be rare and earned. Do NOT cluster scores around 7-8 out of politeness. A poor quality photo should score 3-4, not 6-7.

REMINDER: You are being evaluated on accuracy, not kindness. Be honest.

Respond with ONLY valid JSON, no markdown:
{
  "varietyScore": <1-10>,
  "varietyNote": "<observation about variety across all photos>",
  "photos": [
    {
      "photoIndex": <1-based index>,
      "scores": {
        "faceVisibility": <1-10>,
        "imageQuality": <1-10>,
        "expression": <1-10>,
        "composition": <1-10>,
        "authenticity": <1-10>,
        "datingValue": <1-10>
      },
      "overall": <calculated overall 1-10, one decimal>,
      "rank": <1 = best>,
      "highlights": ["<specific positive observation>", "<another>"],
      "issues": ["<specific technical issue, no appearance comments>", "<another if any>"],
      "recommendation": "<specific, actionable recommendation for improving or replacing this photo>"
    }
  ],
  "topPick": <index of best photo, 1-based>,
  "summary": "<overall assessment of the photo set in 1-2 sentences>"
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

// POST /api/rank-photos
// EITHER multipart/form-data: photos[] (images) — manual upload
// OR JSON: { analysisId } — automatically ranks the photos already uploaded during the initial audit
router.post("/", upload.array("photos", 10), async (req, res) => {
  try {
    let files = req.files;
    let analysisRecord = null;
    let skipValidation = false;
    const { analysisId } = req.body;

    if ((!files || files.length === 0) && analysisId) {
      analysisRecord = await Analysis.findById(analysisId);
      if (!analysisRecord) return res.status(404).json({ error: "Analysis not found" });

      // Already ranked before — return the cached result instantly, no re-work needed
      if (analysisRecord.rankedPhotos) {
        return res.json({
          photos: JSON.parse(analysisRecord.rankedPhotos),
          varietyNote: analysisRecord.varietyNote || "",
        });
      }

      if (!analysisRecord.photos || analysisRecord.photos.length === 0) {
        return res.status(400).json({ error: "No photos were uploaded with this profile." });
      }

      files = analysisRecord.photos.map(p => ({
        buffer: Buffer.from(p.data, "base64"),
        mimetype: p.mimetype,
      }));
      skipValidation = true; // these were already validated when first uploaded in /api/analyze
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Upload at least one photo" });
    }

    if (!skipValidation) {
      const validation = await validateUploadedImages(anthropic, { photos: files });
      const validFiles = files.filter((_, i) => validation.photos[i]?.valid !== false);
      const rejected = validation.photos.filter(p => p.valid === false);

      if (validFiles.length === 0) {
        return res.status(400).json({
          error: "Those don't look like photos of a person. Please upload your actual profile photos.",
          details: rejected.map(p => p.reason).filter(Boolean),
        });
      }
      files = validFiles;
    }

    const imageBlocks = [];
    files.forEach((file, i) => {
      imageBlocks.push({ type: "text", text: `Photo ${i + 1}:` });
      imageBlocks.push({
        type: "image",
        source: { type: "base64", media_type: file.mimetype, data: file.buffer.toString("base64") },
      });
    });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: buildRankingPrompt(files.length) },
          ],
        },
      ],
    });

    const text = response.content[0].text;
    const parsed = safeParseJSON(text);

    parsed.photos.sort((a, b) => b.overall - a.overall);
    parsed.photos = parsed.photos.map((photo, idx) => ({
  ...photo,
  rank: idx + 1,
  }));

// Recalculate topPick based on sorted order
parsed.topPick = parsed.photos[0].photoIndex;

    // Attach preview URLs (base64) so frontend can show the photos
    const photosWithPreviews = parsed.photos.map((p) => ({
      ...p,
      preview: `data:${files[p.photoIndex - 1].mimetype};base64,${files[p.photoIndex - 1].buffer.toString("base64")}`,
    }));

    if (analysisRecord) {
      analysisRecord.rankedPhotos = JSON.stringify(photosWithPreviews);
      analysisRecord.varietyNote = parsed.varietyNote || "";
      await analysisRecord.save();
    }

    res.json({
      ...parsed,
      photos: photosWithPreviews,
    });
  } catch (err) {
    console.error("Rank photos error:", err);
    res.status(500).json({ error: "Could not rank photos. Try again shortly." });
  }
});

export default router;
