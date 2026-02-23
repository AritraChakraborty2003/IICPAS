import express from "express";
import isStudent from "../middleware/isStudent.js";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";
import {
  createCourseBookingOrder,
  verifyCourseBookingPayment,
  getStudentCourseBookings,
  getAdminCourseBookings,
  resendBookingInvoice,
  downloadBookingInvoice,
} from "../controllers/courseBookingController.js";

const router = express.Router();

router.post("/create-order", isStudent, createCourseBookingOrder);
router.post("/verify-payment", isStudent, verifyCourseBookingPayment);
router.get("/student", isStudent, getStudentCourseBookings);

router.get("/admin", requireAuth, requirePermission("bookings", "read"), getAdminCourseBookings);
router.post(
  "/:id/send-invoice",
  requireAuth,
  requirePermission("bookings", "update"),
  resendBookingInvoice
);
router.get("/:id/invoice", isStudent, downloadBookingInvoice);
router.get(
  "/admin/:id/invoice",
  requireAuth,
  requirePermission("bookings", "read"),
  downloadBookingInvoice
);

export default router;
