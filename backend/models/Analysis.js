import mongoose from "mongoose";

const firstImpressionSchema = new mongoose.Schema({
  overall: Number,
  label: String,
  summary: String,
  scores: {
    friendliness: Number,
    confidence: Number,
    authenticity: Number,
    profileEffort: Number,
    memorability: Number,
    visualAppeal: Number,
  },
  scoreNotes: {
    friendliness: String,
    confidence: String,
    authenticity: String,
    profileEffort: String,
    memorability: String,
    visualAppeal: String,
  },
}, { _id: false });

const analysisSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    app: { type: String, default: "unknown" },
    firstImpression: { type: firstImpressionSchema, default: null },
    score: Number, // kept for backward compat
    scoreDesc: String,
    strengths: [String],
    redFlags: [String],
    improvements: [String],
    rewrittenBio: String,
    mockup: { type: String, default: null },
    photos: [{ data: String, mimetype: String }],
    photoFeedback: { type: String, default: null },
    name: { type: String, default: null },
    rankedPhotos: { type: String, default: null },
    varietyNote: { type: String, default: null },
    paid: { type: Boolean, default: false },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Analysis", analysisSchema);
