import express from "express";
import multer from "multer";
import fs from "fs";
import {
  getAllBrochures,
  getBrochureByCourse,
  saveBrochure,
  deleteBrochure,
} from "../controllers/brochureController.js";

const router = express.Router();

// Ensure brochure image upload dir exists
const brochureImageDir = "uploads/brochure-images";
if (!fs.existsSync(brochureImageDir)) {
  fs.mkdirSync(brochureImageDir, { recursive: true });
}

const brochureImageStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, brochureImageDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const uploadBrochureImage = multer({
  storage: brochureImageStorage,
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Image upload for brochure backgrounds / overlays
router.post("/upload-image", uploadBrochureImage.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    res.json({
      success: true,
      imageUrl: `${baseUrl}/uploads/brochure-images/${req.file.filename}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", getAllBrochures);
router.get("/course/:courseId", getBrochureByCourse);
router.post("/", saveBrochure);
router.delete("/:id", deleteBrochure);

export default router;
