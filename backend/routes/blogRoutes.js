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
import { requireAuth } from "../middleware/requireAuth.js";

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
router.patch("/:id", requireAuth, upload.single("image"), updateBlog);
router.delete("/:id", requireAuth, deleteBlog);

// Toggle status route
router.patch("/:id/toggle-status", requireAuth, toggleBlogStatus);
router.patch("/:id/image", requireAuth, upload.single("image"), updateBlogImage); // Dedicated endpoint for image update
router.patch("/:id/no-image", express.json(), updateBlog); // For n8n (JSON payload without image, bypassing auth)

export default router;
