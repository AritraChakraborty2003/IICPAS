import express from "express";
import {
  createBatchManagerEntry,
  deleteBatchManagerEntry,
  getBatchManagerEntries,
  updateBatchManagerEntry,
  sendStudentScheduleEmail,
} from "../controllers/batchManagerController.js";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission("batch-manager", "read"), getBatchManagerEntries);
router.post("/", requirePermission("batch-manager", "add"), createBatchManagerEntry);
router.put("/:id", requirePermission("batch-manager", "update"), updateBatchManagerEntry);
router.post(
  "/:id/send-schedule/:studentId",
  requirePermission("batch-manager", "update"),
  sendStudentScheduleEmail
);
router.delete(
  "/:id",
  requirePermission("batch-manager", "delete"),
  deleteBatchManagerEntry
);

export default router;
