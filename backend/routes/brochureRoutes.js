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

// Delete an uploaded brochure image file
router.delete("/images/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename || filename.includes("/") || filename.includes("..")) {
      return res.status(400).json({ success: false, error: "Invalid filename" });
    }
    const filepath = `${brochureImageDir}/${filename}`;
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Proxy an uploaded brochure image as base64 — avoids browser CORS for PDF generation
router.get("/image-proxy", (req, res) => {
  try {
    const url = decodeURIComponent(req.query.url || "");
    if (!url) return res.status(400).json({ success: false, error: "Missing url" });

    // Extract just the filename from the URL — only serve files from our own upload dir
    const filename = url.split("/uploads/brochure-images/").pop();
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ success: false, error: "Invalid path" });
    }
    const filepath = `${brochureImageDir}/${filename}`;
    if (!fs.existsSync(filepath)) return res.status(404).json({ success: false, error: "Not found" });

    const data = fs.readFileSync(filepath);
    const ext = filename.split(".").pop()?.toLowerCase() || "jpeg";
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
    const base64 = `data:${mime};base64,${data.toString("base64")}`;
    res.json({ success: true, base64 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", getAllBrochures);
router.get("/course/:courseId", getBrochureByCourse);
router.post("/", saveBrochure);
router.delete("/:id", deleteBrochure);

export default router;
