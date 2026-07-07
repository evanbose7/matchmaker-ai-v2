import "dotenv/config";
import dns from "dns";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import analyzeRoutes from "./routes/analyze.js";
import paymentsRoutes from "./routes/payments.js";
import rankPhotosRoutes from "./routes/rankPhotos.js";
import reportRoutes from "./routes/report.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_URL || "").replace(/\/$/, "");
    if (!origin || origin.replace(/\/$/, "") === allowed || allowed === "") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));

app.use(express.json({ limit: "50mb" }));

app.use("/api/analyze", analyzeRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/rank-photos", rankPhotosRoutes);
app.use("/api/report", reportRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
