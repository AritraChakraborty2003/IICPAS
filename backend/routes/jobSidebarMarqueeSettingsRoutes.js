import express from "express";
import {
  getJobSidebarMarqueeSettings,
  upsertJobSidebarMarqueeSettings,
} from "../controllers/jobSidebarMarqueeSettingsController.js";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", getJobSidebarMarqueeSettings);
router.post(
  "/",
  requireAuth,
  requirePermission("job-sidebar-marquee", "update"),
  upsertJobSidebarMarqueeSettings
);
router.patch(
  "/",
  requireAuth,
  requirePermission("job-sidebar-marquee", "update"),
  upsertJobSidebarMarqueeSettings
);

export default router;
