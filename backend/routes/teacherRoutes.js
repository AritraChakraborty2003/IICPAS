// routes/teacherRoutes.js
import express from "express";
import {
  teacherRegister,
  teacherLogin,
  teacherLogout,
  getTeacherProfile,
  updateTeacherProfile,
  getAllTeachers,
  getTeacherById,
  deleteTeacher,
} from "../controllers/teacherControllers.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { isTeacher } from "../middleware/isTeacher.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Public routes
router.post("/register", teacherRegister);
router.post("/login", teacherLogin);
router.post("/logout", teacherLogout);

// Protected routes - Teacher only
router.get("/profile", requireAuth, isTeacher, getTeacherProfile);
router.put("/profile", requireAuth, isTeacher, updateTeacherProfile);

// Admin routes
router.get("/all", requireAuth, isAdmin, getAllTeachers);
router.get("/:id", requireAuth, isAdmin, getTeacherById);
router.delete("/:id", requireAuth, isAdmin, deleteTeacher);

export default router;
