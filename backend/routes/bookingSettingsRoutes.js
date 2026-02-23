import express from "express";
import {
  getBookingSettings,
  upsertBookingSettings,
} from "../controllers/bookingSettingsController.js";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", requirePermission("booking-settings", "read"), getBookingSettings);
router.post("/", requirePermission("booking-settings", "update"), upsertBookingSettings);
router.patch("/", requirePermission("booking-settings", "update"), upsertBookingSettings);

export default router;
