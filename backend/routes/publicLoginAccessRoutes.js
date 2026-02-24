import express from "express";
import { requireMasterApiKey } from "../middleware/masterApiKey.js";
import {
  listLoginAccessUsers,
  updateSingleLoginStatus,
} from "../controllers/masterLoginAccessController.js";

const router = express.Router();

router.use(requireMasterApiKey);

// API-key protected public endpoints (no session login required)
router.get("/users", listLoginAccessUsers);
router.patch("/users/:role/:userId", updateSingleLoginStatus);

export default router;
