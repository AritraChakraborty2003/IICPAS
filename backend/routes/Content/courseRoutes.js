import { Router } from "express";
import * as courseController from "../../controllers/content/courseControllers.js";
import upload from "./utils/multer.js";
import { requireBearerToken } from "../../middleware/requireBearerToken.js";
const router = Router();

router.get("/", courseController.getAllCourses);
router.get("/all", courseController.getAllCourses);
router.get("/available", courseController.getAvailableCourses);
router.get("/student-courses/:studentId", courseController.getStudentCourses);
router.post("/", upload.fields([{ name: "image", maxCount: 1 }, { name: "dashboardImage", maxCount: 1 }]), courseController.createCourse);
router.put("/reorder", courseController.reorderCourses);
router.put("/:id", requireBearerToken, upload.fields([{ name: "image", maxCount: 1 }, { name: "dashboardImage", maxCount: 1 }]), courseController.updateCourse);
router.delete("/:id", requireBearerToken, courseController.deleteCourse);
router.get("/:id", courseController.getCourse);
router.put("/:id/toggle-status", courseController.toggleCourseStatus);

// Course Level Management Routes
router.get("/course-levels", courseController.getCourseLevels);

// Simulation Image Upload Route
router.post("/upload-simulation-image", upload.single("image"), courseController.uploadSimulationImage);

export default router;
