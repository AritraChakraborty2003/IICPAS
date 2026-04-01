import Coupon from "../models/Coupon.js";

const validateCouponPayload = ({ code, discountType, discountValue, expiresAt }) => {
  if (!code?.trim() || !discountType || discountValue === undefined || !expiresAt) {
    return "code, discountType, discountValue, and expiresAt are required";
  }

  const normalizedType = discountType.toLowerCase();
  if (!["amount", "percentage"].includes(normalizedType)) {
    return "discountType must be either \"amount\" or \"percentage\"";
  }

  if (Number(discountValue) < 0) {
    return "discountValue must be zero or a positive number";
  }

  const expiryDate = new Date(expiresAt);
  if (Number.isNaN(expiryDate.getTime())) {
    return "expiresAt must be a valid date";
  }

  if (expiryDate <= new Date()) {
    return "expiresAt must point to a future date";
  }

  return null;
};

const normalizeCouponCode = (code) => code?.trim().toUpperCase() || "";

export const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ expiresAt: 1, createdAt: -1 });

    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error("Failed to fetch active coupons", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active coupons",
      error: error.message,
    });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error("Failed to fetch coupons", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    console.error("Failed to fetch coupon", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
      error: error.message,
    });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const error = validateCouponPayload(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const normalizedCode = normalizeCouponCode(req.body.code);
    if (!normalizedCode) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code is required" });
    }

    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Coupon with this code already exists" });
    }

    const coupon = new Coupon({
      code: normalizedCode,
      description: req.body.description || "",
      discountType: req.body.discountType.toLowerCase(),
      discountValue: Number(req.body.discountValue),
      expiresAt: new Date(req.body.expiresAt),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      usageLimit: Number(req.body.usageLimit) || 0,
      createdBy: req.user?._id,
    });

    const saved = await coupon.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Failed to create coupon", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    if (req.body.code) {
      const normalizedCode = normalizeCouponCode(req.body.code);
      if (!normalizedCode) {
        return res
          .status(400)
          .json({ success: false, message: "Coupon code cannot be empty" });
      }

      const existing = await Coupon.findOne({
        code: normalizedCode,
        _id: { $ne: coupon._id },
      });
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: "Coupon with this code already exists" });
      }

      coupon.code = normalizedCode;
    }

    if (req.body.discountType) {
      const normalizedType = req.body.discountType.toLowerCase();
      if (!["amount", "percentage"].includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: "discountType must be either \"amount\" or \"percentage\"",
        });
      }
      coupon.discountType = normalizedType;
    }

    if (req.body.discountValue !== undefined) {
      const value = Number(req.body.discountValue);
      if (Number.isNaN(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "discountValue must be zero or a positive number",
        });
      }
      coupon.discountValue = value;
    }

    if (req.body.expiresAt) {
      const expiryDate = new Date(req.body.expiresAt);
      if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "expiresAt must be a valid future date",
        });
      }
      coupon.expiresAt = expiryDate;
    }

    if (req.body.description !== undefined) {
      coupon.description = req.body.description;
    }

    if (req.body.isActive !== undefined) {
      coupon.isActive = Boolean(req.body.isActive);
    }

    if (req.body.usageLimit !== undefined) {
      coupon.usageLimit = Math.max(0, Number(req.body.usageLimit) || 0);
    }

    const updated = await coupon.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update coupon", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error.message,
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    console.error("Failed to delete coupon", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    const updated = await coupon.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to toggle coupon status", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle coupon status",
      error: error.message,
    });
  }
};
