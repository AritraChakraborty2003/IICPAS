import express from "express";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";
import {
  getInvoiceCompanySettings,
  upsertInvoiceCompanySettings,
} from "../controllers/invoiceCompanySettingsController.js";

const router = express.Router();

router.use(requireAuth);
router.get(
  "/",
  requirePermission("invoice-company-settings", "read"),
  getInvoiceCompanySettings
);
router.post(
  "/",
  requirePermission("invoice-company-settings", "update"),
  upsertInvoiceCompanySettings
);
router.patch(
  "/",
  requirePermission("invoice-company-settings", "update"),
  upsertInvoiceCompanySettings
);

export default router;
