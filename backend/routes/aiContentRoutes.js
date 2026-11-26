// Shared AI plumbing, mounted at /api/ai:
//   POST /callback/:jobId?token=...  - n8n posts async results here (HMAC token, no login)
//   GET  /jobs/:id                   - the admin UI polls a generation job
// The AI features themselves live in aiCourseRoutes.js (/api/ai-course).
import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import AiJob from "../models/AiJob.js";
import {
  completeJob,
  expireIfStale,
  callbackToken,
  extractOutput,
  publicJob,
} from "../services/ai/n8nAiService.js";

const router = Router();

// Admins, or staff with add/update permission on courses
export const requireContentAccess = (req, res, next) => {
  const u = req.user;
  const ok =
    u?.role === "Admin" ||
    ["course", "blogs"].some((m) => u?.hasPermission?.(m, "add") || u?.hasPermission?.(m, "update"));
  if (!ok) return res.status(403).json({ message: "You do not have permission to use AI content tools." });
  next();
};

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

// n8n delivers the result of an async job here. Authenticated by the HMAC token
// embedded in the callback URL, so it needs no admin session.
router.post("/callback/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!isId(jobId)) return res.status(400).json({ error: "Invalid job id" });
    if (req.query.token !== callbackToken(jobId)) return res.status(401).json({ error: "Invalid token" });
    const job = await AiJob.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    const output = extractOutput(req.body);
    if (!output) return res.status(400).json({ error: "No content in callback body" });
    const updated = await completeJob(job, output);
    res.json({ success: true, status: updated.status, error: updated.error || undefined });
  } catch (err) {
    console.error("AI callback error:", err);
    res.status(500).json({ error: "Failed to store AI result" });
  }
});

router.use(requireAuth, requireContentAccess);

router.get("/jobs/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid job id" });
  const job = await AiJob.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  await expireIfStale(job);
  res.json({ success: true, job: publicJob(job) });
});

export default router;
