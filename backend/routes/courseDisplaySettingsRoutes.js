import express from "express";
import CourseDisplaySettings from "../models/CourseDisplaySettings.js";

const router = express.Router();

// Get settings
router.get("/", async (req, res) => {
  try {
    const settings = await CourseDisplaySettings.getSettings();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update settings
router.put("/", async (req, res) => {
  try {
    const { showIndividualCourses } = req.body;
    let settings = await CourseDisplaySettings.getSettings();
    
    if (showIndividualCourses !== undefined) {
      settings.showIndividualCourses = showIndividualCourses;
    }
    
    await settings.save();
    res.status(200).json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
