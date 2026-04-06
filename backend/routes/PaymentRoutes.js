import express from "express";
import {
  createPayment,
  getAllPayments,
  getStudentPayments,
  updatePaymentStatus,
  sendInvoiceEmail,
  uploadPaymentScreenshot,
} from "../controllers/paymentController.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import isStudent from "../middleware/isStudent.js";
import upload from "../middleware/upload1.js";

const router = express.Router();

// Create payment record (student)
router.post("/create", isStudent, createPayment);

// Get all payments (admin only)
router.get("/all", requireAuth, isAdmin, getAllPayments);

// Get student payments
router.get("/student/:studentId", isStudent, getStudentPayments);

// Update payment status (admin only)
router.put("/update/:paymentId", requireAuth, isAdmin, updatePaymentStatus);

// Send invoice email (admin only)
router.post("/send-invoice/:paymentId", requireAuth, isAdmin, sendInvoiceEmail);

// Upload payment screenshot
router.post(
  "/upload-screenshot/:paymentId",
  isStudent,
  upload.single("screenshot"),
  uploadPaymentScreenshot
);

export default router;
