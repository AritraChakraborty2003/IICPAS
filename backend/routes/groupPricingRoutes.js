import express from "express";
import {
  getAllGroupPricing,
  getGroupPricingById,
  getGroupPricingBySlug,
  createGroupPricing,
  updateGroupPricing,
  deleteGroupPricing,
  getGroupPricingByLevel,
  getCoursesByLevel,
  enrollInGroupPackage,
} from "../controllers/groupPricingController.js";
import uploadGroupPricingImage from "../middleware/groupPricingImageUpload.js";

const router = express.Router();

// GET /api/group-pricing - Get all group pricing configurations
router.get("/", getAllGroupPricing);

// GET /api/group-pricing/slug/:slug - Get group pricing by slug
router.get("/slug/:slug", getGroupPricingBySlug);

// GET /api/group-pricing/:id - Get group pricing by ID
router.get("/:id", getGroupPricingById);

// POST /api/group-pricing/:id/enroll - Enroll student in group package
router.post("/:id/enroll", enrollInGroupPackage);

const uploadFields = uploadGroupPricingImage.fields([
  { name: "image", maxCount: 1 },
  { name: "certificateImage", maxCount: 1 },
]);

// POST /api/group-pricing - Create new group pricing configuration
router.post("/", uploadFields, createGroupPricing);

// PUT /api/group-pricing/:id - Update group pricing configuration
router.put("/:id", uploadFields, updateGroupPricing);

// DELETE /api/group-pricing/:id - Delete group pricing configuration
router.delete("/:id", deleteGroupPricing);

// GET /api/group-pricing/level/:level - Get group pricing by level
router.get("/level/:level", getGroupPricingByLevel);

// GET /api/group-pricing/courses/:level - Get available courses for a specific level
router.get("/courses/:level", getCoursesByLevel);

export default router;
