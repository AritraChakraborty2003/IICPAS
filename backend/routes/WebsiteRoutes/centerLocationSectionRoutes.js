import express from "express";
import CenterLocationSection from "../../models/Website/CenterLocationSection.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { isAdmin } from "../../middleware/isAdmin.js";

const router = express.Router();

// Get active configuration (for public homepage)
router.get("/", async (req, res) => {
  try {
    const config = await CenterLocationSection.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!config) {
      return res.json({
        badgeText: "Find Your Nearest Center",
        titlePart1: "Search & Book",
        titleHighlight1: "Courses",
        titlePart2: "at",
        titleHighlight2: "IICPA Centers",
        description: "Find the nearest IICPA center, explore available courses, and book your preferred training program with just a few clicks.",
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all configurations (for admin dashboard)
router.get("/all", requireAuth, isAdmin, async (req, res) => {
  try {
    const configs = await CenterLocationSection.find().sort({ createdAt: -1 });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new configuration
router.post("/", requireAuth, isAdmin, async (req, res) => {
  try {
    if (req.body.isActive) {
      await CenterLocationSection.updateMany({}, { isActive: false });
    }
    const newConfig = new CenterLocationSection(req.body);
    const savedConfig = await newConfig.save();
    res.status(201).json(savedConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update configuration
router.put("/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    if (req.body.isActive) {
      await CenterLocationSection.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    }
    const updatedConfig = await CenterLocationSection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedConfig) return res.status(404).json({ message: "Configuration not found" });
    res.json(updatedConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete configuration
router.delete("/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const deletedConfig = await CenterLocationSection.findByIdAndDelete(req.params.id);
    if (!deletedConfig) return res.status(404).json({ message: "Configuration not found" });
    res.json({ message: "Configuration deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
