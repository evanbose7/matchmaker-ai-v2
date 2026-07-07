// Runs BEFORE any real analysis. Classifies each uploaded image as valid or
// not for its intended purpose, so random/unrelated uploads (screenshots of
// a code editor, terminal, unrelated websites, non-person photos, etc.)
// get rejected instead of silently analyzed.
//
// Fails open: if the validation call itself errors out (bad JSON, API hiccup),
// everything is treated as valid rather than blocking the whole feature.

function fileToBlock(file, label) {
  return [
    { type: "text", text: label },
    {
      type: "image",
      source: { type: "base64", media_type: file.mimetype, data: file.buffer.toString("base64") },
    },
  ];
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

export async function validateUploadedImages(client, { screenshots = [], photos = [] }) {
  const fallback = {
    screenshots: screenshots.map((_, i) => ({ index: i + 1, valid: true, reason: "" })),
    photos: photos.map((_, i) => ({ index: i + 1, valid: true, reason: "" })),
  };

  if (screenshots.length === 0 && photos.length === 0) return fallback;

  try {
    const blocks = [
      ...screenshots.flatMap((f, i) => fileToBlock(f, `Screenshot ${i + 1}:`)),
      ...photos.flatMap((f, i) => fileToBlock(f, `Photo ${i + 1}:`)),
    ];

    const prompt = `You are checking uploaded images BEFORE any dating profile analysis happens. Be strict.

There are ${screenshots.length} "screenshot" image(s) and ${photos.length} "photo" image(s).

A SCREENSHOT is valid ONLY if it is a screenshot of a dating app profile page showing bio text, prompts, interests, or similar profile info. Screenshots of anything else — websites, code editors, terminal windows, documents, developer tools, chat apps, settings pages, unrelated apps — are INVALID.

A PHOTO is valid ONLY if it clearly shows a person (a portrait, selfie, or full-body shot usable as a dating profile picture). Anything that is not a photo of a person — screenshots, text, code, objects, animals, memes, random pictures — is INVALID.

Respond with ONLY valid JSON, exactly ${screenshots.length} screenshot entries and ${photos.length} photo entries, in order:
{
  "screenshots": [{ "index": 1, "valid": true, "reason": "<max 10 words, why>" }],
  "photos": [{ "index": 1, "valid": true, "reason": "<max 10 words, why>" }]
}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1200,
      messages: [{ role: "user", content: [...blocks, { type: "text", text: prompt }] }],
    });

    const parsed = safeParseJSON(response.content[0].text);

    return {
      screenshots: Array.isArray(parsed.screenshots) && parsed.screenshots.length === screenshots.length
        ? parsed.screenshots : fallback.screenshots,
      photos: Array.isArray(parsed.photos) && parsed.photos.length === photos.length
        ? parsed.photos : fallback.photos,
    };
  } catch (err) {
    console.error("Image validation error (failing open):", err);
    return fallback;
  }
}
