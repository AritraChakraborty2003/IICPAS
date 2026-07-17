import express from "express";
import multer from "multer";
import {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
  createBlogNoImage,
  updateBlogImage,
} from "../controllers/blogControllers.js";
import { requireBearerToken } from "../middleware/requireBearerToken.js";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});
const upload = multer({ storage });

// CRUD routes
router.post("/", upload.single("image"), createBlog);
router.post("/no-image", express.json(), createBlogNoImage); // For n8n (JSON payload without image)
router.get("/", getBlogs);
router.get("/:id", getBlog);
router.patch("/:id", requireBearerToken, upload.single("image"), updateBlog);
router.delete("/:id", requireBearerToken, deleteBlog);

// Toggle status route
router.patch("/:id/toggle-status", requireBearerToken, toggleBlogStatus);
router.patch("/:id/image", requireBearerToken, upload.single("image"), updateBlogImage); // Dedicated endpoint for image update

export default router;
