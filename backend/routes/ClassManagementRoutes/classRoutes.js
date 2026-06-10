import express from "express";
import {
  getAllClasses,
  getClassById,
  getClassesByCourse,
  getClassesForStudent,
  createClass,
  updateClass,
  deleteClass,
  toggleClassActive,
  convertToRecorded,
} from "../../controllers/ClassManagementController/classController.js";

const router = express.Router();

// List all classes (admin). Supports ?type=live|recorded&course=&active=
router.get("/", getAllClasses);

// Classes for a specific course (student-facing)
router.get("/course/:courseId", getClassesByCourse);

// All of a student's classes across their purchased courses (student-facing)
router.get("/for-student/:studentId", getClassesForStudent);

// Single class
router.get("/:id", getClassById);

// Create
router.post("/", createClass);

// Update
router.patch("/:id", updateClass);

// Toggle active/inactive
router.patch("/:id/toggle", toggleClassActive);

// Force convert live -> recorded
router.patch("/:id/convert", convertToRecorded);

// Delete
router.delete("/:id", deleteClass);

export default router;
