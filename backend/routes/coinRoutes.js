import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import {
  getCoinSettings,
  updateCoinSettings,
} from "../controllers/coinSettingsController.js";

const router = express.Router();

router.get("/settings", requireAuth, isAdmin, getCoinSettings);
router.post("/settings", requireAuth, isAdmin, updateCoinSettings);

export default router;
