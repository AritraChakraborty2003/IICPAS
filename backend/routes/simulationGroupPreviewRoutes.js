import express from "express";
import { getSimulationGroupPreview } from "../controllers/simulationGroupPreviewController.js";

const router = express.Router();

// Access is checked inside the controller (admin, permitted employee or
// student with an active purchase of the chapter's course).
router.get("/preview/:parentId/:groupIndex", getSimulationGroupPreview);

export default router;
