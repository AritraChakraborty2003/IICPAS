import fs from "fs";
import Brochure from "../models/Brochure.js";
import ManualBrochure from "../models/ManualBrochure.js";

const BROCHURE_FILE_DIR = "uploads/brochure-files";

const buildFileBaseUrl = (req) =>
  (process.env.API_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/api\/?$/, "");

const removeStoredFile = (storedFilename) => {
  if (!storedFilename || storedFilename.includes("/") || storedFilename.includes("..")) return;
  const filepath = `${BROCHURE_FILE_DIR}/${storedFilename}`;
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch {
    /* file cleanup is best-effort */
  }
};

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
    const { courseId, courseName, chapters, coverPage, pages } = req.body;
    if (!courseId || !courseName) {
      return res.status(400).json({ success: false, error: "courseId and courseName are required" });
    }

    const updateData = {
      courseId,
      courseName,
      chapters: chapters || [],
      coverPage: coverPage || {},
      pages: pages || [],
    };

    const brochure = await Brochure.findOneAndUpdate(
      { courseId },
      updateData,
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

// ─── Manually uploaded brochure files ────────────────────────────────────────

export const getAllManualBrochures = async (req, res) => {
  try {
    const brochures = await ManualBrochure.find().sort({ createdAt: -1 });
    res.json({ success: true, data: brochures });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getManualBrochureByCourse = async (req, res) => {
  try {
    const brochure = await ManualBrochure.findOne({ courseId: req.params.courseId });
    if (!brochure) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: brochure });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const uploadManualBrochure = async (req, res) => {
  try {
    const { courseId, courseName, courseType } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No brochure file uploaded" });
    }
    if (!courseId || !courseName) {
      removeStoredFile(req.file.filename);
      return res.status(400).json({ success: false, error: "courseId and courseName are required" });
    }

    const fileUrl = `${buildFileBaseUrl(req)}/${BROCHURE_FILE_DIR}/${encodeURIComponent(req.file.filename)}`;

    // Replacing an existing brochure for this course? Remove the old file.
    const existing = await ManualBrochure.findOne({ courseId });
    if (existing) removeStoredFile(existing.storedFilename);

    const brochure = await ManualBrochure.findOneAndUpdate(
      { courseId },
      {
        courseId,
        courseType: courseType === "GroupPricing" ? "GroupPricing" : "Course",
        courseName,
        fileUrl,
        fileName: req.file.originalname,
        storedFilename: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: brochure });
  } catch (err) {
    if (req.file) removeStoredFile(req.file.filename);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteManualBrochure = async (req, res) => {
  try {
    const brochure = await ManualBrochure.findByIdAndDelete(req.params.id);
    if (brochure) removeStoredFile(brochure.storedFilename);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
