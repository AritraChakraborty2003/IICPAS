import express from "express";
import {
  getPublicAuditLogs,
  getPublicLoggedInUsers,
  postHeartbeat,
} from "../controllers/authAuditController.js";
import { requireAnyAuthActor } from "../middleware/authActor.js";

const router = express.Router();

router.get("/public/auth/audit-logs", getPublicAuditLogs);
router.get("/public/auth/logged-in-users", getPublicLoggedInUsers);
router.post("/auth/heartbeat", requireAnyAuthActor, postHeartbeat);

export default router;
