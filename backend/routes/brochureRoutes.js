import express from "express";
import {
  getAllBrochures,
  getBrochureByCourse,
  saveBrochure,
  deleteBrochure,
} from "../controllers/brochureController.js";

const router = express.Router();

router.get("/", getAllBrochures);
router.get("/course/:courseId", getBrochureByCourse);
router.post("/", saveBrochure);
router.delete("/:id", deleteBrochure);

export default router;
