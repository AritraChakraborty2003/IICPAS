import express from "express";
import {
  getConfigBySlug,
  getAllConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  getOverrideById,
  createOverride,
  updateOverride,
  deleteOverride,
} from "../controllers/simulationConfigController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Public — student-facing simulation pages read their config here.
// Per-insert overrides (?simCfg=<id> on the simulation URL) take
// precedence over the slug config and are fetched by id.
router.get("/public/override/:id", getOverrideById);
router.get("/public/:slug", getConfigBySlug);

// Admin CRUD
router.get("/", requireAuth, isAdmin, getAllConfigs);
router.post("/", requireAuth, isAdmin, createConfig);
router.put("/:id", requireAuth, isAdmin, updateConfig);
router.delete("/:id", requireAuth, isAdmin, deleteConfig);

// Admin — per-insert overrides created from the course editor
router.post("/overrides", requireAuth, isAdmin, createOverride);
router.put("/overrides/:id", requireAuth, isAdmin, updateOverride);
router.delete("/overrides/:id", requireAuth, isAdmin, deleteOverride);

export default router;
