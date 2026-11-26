// AI chapter assessments (practical assignment + chapter quiz), mounted at
// /api/ai-assessments. Admin / content staff only.
//   GET  /chapter/:chapterId           - status, drafts and validation for a chapter
//   POST /chapter/:chapterId/generate  - generate / regenerate / retry ({ kinds, difficulty, instructions })
//   PUT  /:id/draft                    - save admin edits to the draft (validated)
//   POST /:id/publish                  - approve and publish to students
//   POST /:id/unpublish                - hide from students again
//   POST /:id/review                   - AI quality review of the draft
//   GET  /:id/instructor-guide         - reference solution of a published assignment
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireContentAccess } from "./aiContentRoutes.js";
import Assignment from "../models/Assignment.js";
import {
  KINDS,
  getChapterAssessments,
  startChapterGeneration,
  updateDraft,
  publishAssessment,
  unpublishAssessment,
  startAiReview,
} from "../services/chapterAssessmentService.js";

const router = Router();
router.use(requireAuth, requireContentAccess);

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (!err.status) console.error("AI assessment route error:", err);
    res.status(err.status || 500).json({ message: err.status ? err.message : "Something went wrong.", details: err.details });
  }
};

router.get(
  "/chapter/:chapterId",
  handle(async (req, res) => {
    res.json({ success: true, ...(await getChapterAssessments(req.params.chapterId)) });
  })
);

router.post(
  "/chapter/:chapterId/generate",
  handle(async (req, res) => {
    const kinds = (Array.isArray(req.body.kinds) ? req.body.kinds : KINDS).filter((k) => KINDS.includes(k));
    if (!kinds.length) return res.status(400).json({ message: "Choose what to generate." });
    const results = await startChapterGeneration(req.params.chapterId, {
      kinds,
      trigger: "manual",
      userId: req.user?._id,
      difficulty: req.body.difficulty,
      instructions: req.body.instructions,
    });
    res.json({ success: true, results, ...(await getChapterAssessments(req.params.chapterId)) });
  })
);

router.put(
  "/:id/draft",
  handle(async (req, res) => {
    if (!req.body?.draft || typeof req.body.draft !== "object") return res.status(400).json({ message: "Missing draft." });
    res.json({ success: true, item: await updateDraft(req.params.id, req.body.draft) });
  })
);

router.post(
  "/:id/publish",
  handle(async (req, res) => {
    res.json({ success: true, item: await publishAssessment(req.params.id) });
  })
);

router.post(
  "/:id/unpublish",
  handle(async (req, res) => {
    res.json({ success: true, item: await unpublishAssessment(req.params.id) });
  })
);

router.post(
  "/:id/review",
  handle(async (req, res) => {
    res.json({ success: true, ...(await startAiReview(req.params.id, req.user?._id)) });
  })
);

router.get(
  "/:id/instructor-guide",
  handle(async (req, res) => {
    const rec = await Assignment.findById(req.params.id).select("title +instructorGuide");
    if (!rec) return res.status(404).json({ message: "Assignment not found" });
    res.json({ success: true, title: rec.title, instructorGuide: rec.instructorGuide || null });
  })
);

export default router;
