import Brochure from "../models/Brochure.js";

export const getAllBrochures = async (req, res) => {
  try {
    const brochures = await Brochure.find().sort({ createdAt: -1 });
    res.json({ success: true, data: brochures });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getBrochureByCourse = async (req, res) => {
  try {
    const brochure = await Brochure.findOne({ courseId: req.params.courseId });
    if (!brochure) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: brochure });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const saveBrochure = async (req, res) => {
  try {
    const { courseId, courseName, chapters } = req.body;
    if (!courseId || !courseName) {
      return res.status(400).json({ success: false, error: "courseId and courseName are required" });
    }

    const brochure = await Brochure.findOneAndUpdate(
      { courseId },
      { courseId, courseName, chapters: chapters || [] },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: brochure });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteBrochure = async (req, res) => {
  try {
    await Brochure.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
