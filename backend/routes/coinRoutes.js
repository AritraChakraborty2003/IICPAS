import express from "express";
import {
  getCoinSettings,
  updateCoinSettings,
} from "../controllers/coinSettingsController.js";

const router = express.Router();

router.get("/settings", getCoinSettings);
router.post("/settings", updateCoinSettings);
router.patch("/settings", updateCoinSettings);

export default router;
