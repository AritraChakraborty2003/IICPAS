import express from "express";
import {
  getActiveCoupons,
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from "../controllers/couponController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/active", getActiveCoupons);
router.get("/", requireAuth, isAdmin, getAllCoupons);
router.get("/:id", requireAuth, isAdmin, getCouponById);
router.post("/", requireAuth, isAdmin, createCoupon);
router.put("/:id", requireAuth, isAdmin, updateCoupon);
router.delete("/:id", requireAuth, isAdmin, deleteCoupon);
router.patch("/:id/toggle", requireAuth, isAdmin, toggleCouponStatus);

export default router;
