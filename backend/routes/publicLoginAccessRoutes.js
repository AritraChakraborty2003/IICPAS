import express from "express";
import { requireMasterApiKey } from "../middleware/masterApiKey.js";
import {
  listLoginAccessUsers,
  updateSingleLoginStatus,
} from "../controllers/masterLoginAccessController.js";

const router = express.Router();

router.use(requireMasterApiKey);

// API-key protected public endpoints (no session login required)
router.get("/public/login-access/users", listLoginAccessUsers);
router.patch("/public/login-access/users/:role/:userId", updateSingleLoginStatus);

export default router;
