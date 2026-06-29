import express from "express";
import multer from "multer";
import { apiKeyMiddleware } from "../middleware/blogContentAuth.js";
import {
  getBlogContents,
  uploadBlogContent,
  updateBlogContent,
  deleteBlogContent,
} from "../controllers/blogContentControllers.js";

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

// Apply API Key Middleware to all routes in this file
router.use(apiKeyMiddleware);

router.route("/")
  .get(getBlogContents)
  .post(upload.single("file"), uploadBlogContent);

router.route("/:name")
  .patch(updateBlogContent)
  .delete(deleteBlogContent);

export default router;
