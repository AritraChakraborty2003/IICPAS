import express from "express";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";
import {
  createQuotation,
  deleteQuotation,
  deleteQuotationCustomer,
  getQuotationById,
  getQuotationCustomerById,
  getQuotationCustomers,
  getQuotations,
  upsertQuotationCustomer,
  updateQuotation,
} from "../controllers/quotationController.js";

const router = express.Router();

router.use(requireAuth);

router.get(
  "/customers",
  requirePermission("quotation", "read"),
  getQuotationCustomers
);
router.post(
  "/customers",
  requirePermission("quotation", "add"),
  upsertQuotationCustomer
);
router.get(
  "/customers/:id",
  requirePermission("quotation", "read"),
  getQuotationCustomerById
);
router.delete(
  "/customers/:id",
  requirePermission("quotation", "delete"),
  deleteQuotationCustomer
);

router.get("/", requirePermission("quotation", "read"), getQuotations);
router.post("/", requirePermission("quotation", "add"), createQuotation);
router.get("/:id", requirePermission("quotation", "read"), getQuotationById);
router.put("/:id", requirePermission("quotation", "update"), updateQuotation);
router.delete("/:id", requirePermission("quotation", "delete"), deleteQuotation);

export default router;
