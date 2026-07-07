// Shared "facts only" extraction schema for a single dating profile photo.
//
// The whole point of this file: the vision model is ONLY allowed to report
// things it can directly see. It never scores or judges. All scoring happens
// afterward, deterministically, in rankingScoring.js / profileScoring.js —
// so the same inputs always produce the same outputs, and every number can
// be traced back to a specific observed fact.
//
// Any field the model isn't confident about should be "cannot_determine"
// rather than a guess.

export const PHOTO_FACT_FIELDS_PROMPT = `For EACH photo, report ONLY what is directly visible. Do not judge, score, or guess — if you can't tell confidently, use "cannot_determine".

- numPeople: <integer, count of people in the photo>
- faceVisible: <true|false>
- eyeContact: <true|false|"cannot_determine">
- smile: <"genuine"|"slight"|"none"|"cannot_determine">
- posture: <"upright"|"relaxed"|"slouched"|"cannot_determine">
- lighting: <"natural"|"artificial"|"poor"|"mixed">
- sharpness: <"sharp"|"soft"|"blurry">
- filterDetected: <true|false|"cannot_determine">
- background: <short literal description, e.g. "waterfront", "bedroom", "restaurant", "gym">
- composition: <"centered"|"rule_of_thirds"|"off_center"|"cluttered">
- photoType: <"close_up_portrait"|"half_body_portrait"|"full_body"|"selfie"|"group"|"activity"|"candid_moment">
- posed: <true|false|"cannot_determine">
- poseEvidence: "<the specific visual cue behind the posed/candid call, e.g. 'static pose, direct eye contact with camera' or 'mid-laugh, looking away from camera'>"
- activityShown: <true|false>  (an actual hobby/sport/activity in progress — not just standing or sitting)`;

const COMMON_TYPES = ["close_up_portrait", "half_body_portrait", "full_body", "selfie", "group", "activity", "candid_moment"];

export const PHOTO_TYPE_LABELS = {
  close_up_portrait: "Close-up portrait",
  half_body_portrait: "Half-body portrait",
  full_body: "Full-body photo",
  selfie: "Selfie",
  group: "Social/group photo",
  activity: "Hobby/activity photo",
  candid_moment: "Candid photo",
};

// Aggregates per-photo facts into set-level facts (used for variety, dating
// value context, and memorability — anything that depends on the *whole*
// lineup rather than a single photo).
export function aggregateSetFacts(photosFacts) {
  const settings = new Set();
  const types = new Set();
  let hasHobbyPhoto = false;
  let hasSocialPhoto = false;
  let hasCandidPhoto = false;
  let hasFullBodyPhoto = false;

  photosFacts.forEach(f => {
    if (f.background) settings.add(f.background.toLowerCase().trim());
    if (f.photoType) types.add(f.photoType);
    if (f.activityShown === true || f.photoType === "activity") hasHobbyPhoto = true;
    if (f.photoType === "group") hasSocialPhoto = true;
    if (f.photoType === "candid_moment" || f.posed === false) hasCandidPhoto = true;
    if (f.photoType === "full_body") hasFullBodyPhoto = true;
  });

  const missingTypes = COMMON_TYPES.filter(t => !types.has(t));

  return {
    distinctSettings: [...settings],
    distinctPhotoTypes: [...types],
    missingTypes,
    hasHobbyPhoto,
    hasSocialPhoto,
    hasCandidPhoto,
    hasFullBodyPhoto,
    photoCount: photosFacts.length,
  };
}

export function safeParseJSON(text) {
  return JSON.parse(
    text.trim()
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim()
  );
}
