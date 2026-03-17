import express from "express";
import {
  getOurPartnersSettings,
  upsertOurPartnersSettings,
} from "../controllers/ourPartnersSettingsController.js";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", getOurPartnersSettings);
router.post(
  "/",
  requireAuth,
  requirePermission("our-partners", "update"),
  upsertOurPartnersSettings
);
router.patch(
  "/",
  requireAuth,
  requirePermission("our-partners", "update"),
  upsertOurPartnersSettings
);

export default router;
