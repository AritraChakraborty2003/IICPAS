import express from "express";
import multer from "multer";
import fs from "fs";
import * as caseStudyController from "../controllers/caseStudyController.js";

const router = express.Router();

const caseStudyImageDir = "uploads/case-studies-images";
if (!fs.existsSync(caseStudyImageDir)) {
  fs.mkdirSync(caseStudyImageDir, { recursive: true });
}

const caseStudyImageStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, caseStudyImageDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const uploadCaseStudyImage = multer({
  storage: caseStudyImageStorage,
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Image upload for case study rich text content (Jodit editor)
router.post("/upload-image", uploadCaseStudyImage.any(), (req, res) => {
  try {
    const file = (req.files && req.files[0]) || req.file;
    if (!file) return res.status(400).json({ success: false, error: "No file uploaded" });
    const baseUrl = (process.env.API_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/api\/?$/, "");
    const fileUrl = `${baseUrl}/uploads/case-studies-images/${file.filename}`;
    res.json({ baseurl: "", files: [fileUrl], error: 0, message: "File uploaded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new case study
router.post("/", caseStudyController.createCaseStudy);

// Get all case studies for a chapter
router.get("/chapter/:chapterId", caseStudyController.getCaseStudiesByChapter);

// Get single case study
router.get("/:id", caseStudyController.getCaseStudy);

// Update case study
router.put("/:id", caseStudyController.updateCaseStudy);

// Delete case study
router.delete("/:id", caseStudyController.deleteCaseStudy);

// Add task to case study
router.post("/:id/tasks", caseStudyController.addTask);

// Add content to case study
router.post("/:id/content", caseStudyController.addContent);

// Add simulation to case study
router.post("/:id/simulations", caseStudyController.addSimulation);

// Add question set to case study
router.post("/:id/question-sets", caseStudyController.addQuestionSet);

export default router;
