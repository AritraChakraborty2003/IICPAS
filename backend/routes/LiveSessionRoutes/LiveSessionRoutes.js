import express from "express";
import {
  createLiveSession,
  getAllLiveSessions,
  getLiveSessionById,
  getLiveSessionsForStudent,
  getCourseLiveLessonsForStudent,
  enrollInLiveSession,
  unenrollFromLiveSession,
  updateLiveSession,
  deleteLiveSession,
  toggleStatus,
} from "../../controllers/LiveSessionController/LiveSesionController.js";

const router = express.Router();

// Get all live sessions
router.get("/", getAllLiveSessions);

// Get live sessions filtered to a specific student's purchased courses
router.get("/for-student/:studentId", getLiveSessionsForStudent);

// Get live lessons nested in the topics/chapters of student's purchased courses
router.get("/course-lessons/:studentId", getCourseLiveLessonsForStudent);

// Get single live session by ID
router.get("/:id", getLiveSessionById);

// Create new live session
router.post("/", createLiveSession);

// Enroll in live session
router.post("/:id/enroll", enrollInLiveSession);

// Unenroll from live session
router.post("/:id/unenroll", unenrollFromLiveSession);

// Update live session
router.patch("/:id", updateLiveSession);

// Delete live session
router.delete("/:id", deleteLiveSession);

// Toggle session status
router.patch("/toggle/:id", toggleStatus);

export default router;
