import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Analysis from "../models/Analysis.js";
import { getLocalizedPrice } from "../lib/currency.js";

const router = express.Router();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PRICE_USD_CENTS = 499; // $4.99 — kept for reference; actual pricing now goes through getLocalizedPrice()

// GET /api/payments/localized-price?currency=EUR
router.get("/localized-price", async (req, res) => {
  try {
    const price = await getLocalizedPrice(req.query.currency);
    res.json(price);
  } catch (err) {
    console.error("Localized price error:", err);
    res.status(500).json({ error: "Could not load price" });
  }
});

router.post("/create-order", async (req, res) => {
  try {
    const { analysisId, currency } = req.body;
    const record = await Analysis.findById(analysisId);
    if (!record) return res.status(404).json({ error: "Analysis not found" });

    let price = await getLocalizedPrice(currency);

    let order;
    try {
      order = await razorpay.orders.create({
        amount: price.subunits,
        currency: price.currency,
        receipt: String(record._id),
        notes: { analysisId: String(record._id) },
      });
    } catch (orderErr) {
      if (price.currency !== "USD") {
        console.error(`Razorpay rejected ${price.currency}, falling back to USD:`, orderErr.error?.description || orderErr.message);
        price = await getLocalizedPrice("USD");
        order = await razorpay.orders.create({
          amount: price.subunits,
          currency: price.currency,
          receipt: String(record._id),
          notes: { analysisId: String(record._id) },
        });
      } else {
        throw orderErr;
      }
    }

    record.razorpayOrderId = order.id;
    await record.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      analysisId: String(record._id),
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Could not create payment order" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, analysisId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    await Analysis.findByIdAndUpdate(analysisId, {
      paid: true,
      razorpayPaymentId: razorpay_payment_id,
    });

    res.json({ success: true, analysisId });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

router.get("/unlock/:analysisId", async (req, res) => {
  const record = await Analysis.findById(req.params.analysisId);
  if (!record) return res.status(404).json({ error: "Analysis not found" });
  if (!record.paid) return res.status(402).json({ error: "Payment required" });

  res.json({
    analysisId: record._id,
    firstImpression: record.firstImpression,
    score: record.score,
    scoreDesc: record.scoreDesc,
    strengths: record.strengths,
    redFlags: record.redFlags,
    improvements: record.improvements,
    rewrittenBio: record.rewrittenBio,
    mockup: record.mockup ? JSON.parse(record.mockup) : null,
    rankedPhotos: record.rankedPhotos ? JSON.parse(record.rankedPhotos) : [],
    varietyNote: record.varietyNote || "",
    hasStoredPhotos: !!(record.photos && record.photos.length > 0),
    paid: true,
  });
});

export default router;