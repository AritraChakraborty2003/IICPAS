import express from "express";
import {
  getConfigBySlug,
  getAllConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
} from "../controllers/simulationConfigController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Public — student-facing simulation pages read their config here
router.get("/public/:slug", getConfigBySlug);

// Admin CRUD
router.get("/", requireAuth, isAdmin, getAllConfigs);
router.post("/", requireAuth, isAdmin, createConfig);
router.put("/:id", requireAuth, isAdmin, updateConfig);
router.delete("/:id", requireAuth, isAdmin, deleteConfig);

export default router;
