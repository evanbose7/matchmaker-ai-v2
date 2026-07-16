import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildBioPrompt(form) {
  const { name, age, profession, interests, lookingFor, style, funFact, platform } = form;

  return `You are a dating profile copywriter. Write profile content for someone with these details:

Name: ${name || "not given"}
Age: ${age || "not given"}
Profession: ${profession || "not given"}
Interests/hobbies: ${interests || "not given"}
Looking for: ${lookingFor || "not specified"}
Personality style: ${style || "not specified"}
Fun fact: ${funFact || "not given"}
Platform: ${platform || "Tinder"}

Write genuinely good, natural-sounding profile content — not generic templates. Make it sound like a real, interesting person wrote it, not an AI. Avoid clichés like "love to laugh" or "work hard play hard."

Respond with ONLY valid JSON, no markdown, no preamble:
{
  "bios": [
    "<bio option 1 — 2-3 sentences, distinct tone/angle>",
    "<bio option 2 — different angle from option 1>",
    "<bio option 3 — different angle from options 1 and 2>"
  ],
  "prompts": [
    { "question": "<a good prompt question for this person>", "answer": "<compelling, specific answer based on their details>" },
    { "question": "<another prompt question>", "answer": "<another answer>" },
    { "question": "<another prompt question>", "answer": "<another answer>" },
    { "question": "<another prompt question>", "answer": "<another answer>" },
    { "question": "<another prompt question>", "answer": "<another answer>" }
  ],
  "openingLines": [
    "<a opening line someone could use to message this person, or this person could use to open with a match>",
    "<another opening line>",
    "<another opening line>"
  ]
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

// POST /api/builder
// Body: { name, age, profession, interests, lookingFor, style, funFact, platform }
router.post("/", async (req, res) => {
  try {
    const form = req.body || {};

    if (!form.interests && !form.profession && !form.funFact) {
      return res.status(400).json({
        error: "Tell us a bit more about yourself — interests, profession, or a fun fact.",
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: buildBioPrompt(form) }],
    });

    const text = response.content[0].text;
    const parsed = safeParseJSON(text);

    res.json({
      bios: parsed.bios || [],
      prompts: parsed.prompts || [],
      openingLines: parsed.openingLines || [],
    });
  } catch (err) {
    console.error("Builder error:", err);
    res.status(500).json({ error: "Could not generate your profile content. Try again shortly." });
  }
});

export default router;
