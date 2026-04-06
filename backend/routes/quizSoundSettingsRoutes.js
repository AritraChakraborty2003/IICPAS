import express from "express";
import {
  getQuizSoundSettings,
  updateQuizSoundSettings,
  uploadQuizSound,
  upload,
} from "../controllers/quizSoundSettingsController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/settings", getQuizSoundSettings);
router.get("/admin/settings", requireAuth, isAdmin, getQuizSoundSettings);
router.post("/settings", requireAuth, isAdmin, updateQuizSoundSettings);
router.post(
  "/upload",
  requireAuth,
  isAdmin,
  upload.single("audio"),
  uploadQuizSound
);

export default router;
