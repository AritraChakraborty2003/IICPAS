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

// Use the same relative path that express.static("uploads") in index.js serves
const brochureImageDir = "uploads/brochure-images";
if (!fs.existsSync(brochureImageDir)) {
  fs.mkdirSync(brochureImageDir, { recursive: true });
}

const brochureImageStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, brochureImageDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
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
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });
    const baseUrl = (process.env.API_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/api\/?$/, "");
    res.json({
      success: true,
      imageUrl: `${baseUrl}/uploads/brochure-images/${req.file.filename}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List all uploaded brochure images
router.get("/images", (req, res) => {
  try {
    const baseUrl = (process.env.API_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/api\/?$/, "");
    const files = fs.existsSync(brochureImageDir)
      ? fs.readdirSync(brochureImageDir).reverse()
      : [];
    const data = files
      .filter((f) => /\.(jpe?g|png|gif|webp|svg)$/i.test(f))
      .map((f) => ({ filename: f, url: `${baseUrl}/uploads/brochure-images/${f}` }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", getAllBrochures);
router.get("/course/:courseId", getBrochureByCourse);
router.post("/", saveBrochure);
router.delete("/:id", deleteBrochure);

export default router;
