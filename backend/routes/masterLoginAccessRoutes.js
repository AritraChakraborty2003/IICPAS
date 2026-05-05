import express from "express";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";
import { requireMasterApiKey } from "../middleware/masterApiKey.js";
import {
  deleteSingleLoginAccess,
  listLoginAccessUsers,
  updateBulkLoginStatus,
  updateSingleLoginStatus,
} from "../controllers/masterLoginAccessController.js";

const router = express.Router();

router.use(requireAuth);
router.use(requirePermission("staff", "update"));
router.use(requireMasterApiKey);

router.get("/users", listLoginAccessUsers);
router.patch("/users/:role/:userId", updateSingleLoginStatus);
router.delete("/users/:role/:userId", deleteSingleLoginAccess);
router.patch("/users/bulk", updateBulkLoginStatus);

export default router;
