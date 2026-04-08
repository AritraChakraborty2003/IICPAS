import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/requireAuth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Ensure directories exist
const videoDir = "uploads/videos";
const imageDir = "uploads/images";
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Configure Multer storage for videos
const videoStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, videoDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

// Video upload middleware with validation
export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    // Accept only video files
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 350 * 1024 * 1024, // 350MB limit for videos
  },
});

// Configure Multer storage for images
const imageStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, imageDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const upload = multer({ storage: videoStorage });

// Video upload route (protected - admin only)
router.post("/video", requireAuth, isAdmin, uploadVideo.single("video"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Use API_URL from environment if available, otherwise use request host
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const videoUrl = `${baseUrl}/uploads/videos/${req.file.filename}`;

    res.json({ videoUrl });
  } catch (error) {
    console.error("Video upload error:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// Image upload route (protected - admin only)
router.post("/image", requireAuth, isAdmin, uploadImage.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Return the image path that can be used by the frontend
    // Since images are served from /uploads, we return the full path
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;
    
    // Also return a relative path for frontend use
    const relativePath = `/uploads/images/${req.file.filename}`;

    res.json({ 
      imageUrl: imageUrl,
      relativePath: relativePath,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
