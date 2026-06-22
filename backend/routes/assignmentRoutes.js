import express from "express";
import multer from "multer";
import fs from "fs";
import * as assignmentController from "../controllers/assignmentController.js";

const router = express.Router();

const assignmentImageDir = "uploads/assignment-images";
if (!fs.existsSync(assignmentImageDir)) {
  fs.mkdirSync(assignmentImageDir, { recursive: true });
}

const assignmentImageStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, assignmentImageDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const uploadAssignmentImage = multer({
  storage: assignmentImageStorage,
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Image upload for assignment rich text content (Jodit editor)
// Returns { files: [url] } — the format Jodit's uploader expects
router.post("/upload-image", uploadAssignmentImage.single("files[]"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/assignment-images/${req.file.filename}`;
    res.json({ files: [fileUrl] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new assignment
router.post("/", assignmentController.createAssignment);

// Get all assignments
router.get("/", assignmentController.getAllAssignments);

// Get assignments by status (active/inactive)
router.get("/status/:status", assignmentController.getAssignmentsByStatus);

// Get assignments with advanced filtering
router.get("/filter", assignmentController.getAssignmentsWithFilter);

// Get all assignments for a chapter
router.get("/chapter/:chapterId", assignmentController.getAssignmentsByChapter);

// Get single assignment
router.get("/:id", assignmentController.getAssignment);

// Update assignment
router.put("/:id", assignmentController.updateAssignment);

// Delete assignment
router.delete("/:id", assignmentController.deleteAssignment);

// Add task to assignment
router.post("/:id/tasks", assignmentController.addTask);

// Add content to assignment
router.post("/:id/content", assignmentController.addContent);

// Add simulation to assignment
router.post("/:id/simulations", assignmentController.addSimulation);

// Add question set to assignment
router.post("/:id/question-sets", assignmentController.addQuestionSet);

export default router;
