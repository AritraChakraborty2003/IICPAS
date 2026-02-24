import express from "express";
import {
  collegeSignup,
  collegeLogin,
  collegeLogout,
  isCollegeLoggedIn,
  sendCollegeOTP,
  resetCollegePassword,
  updateCollegeProfile,
  toggleCollegeStatus,
  deleteCollege,
} from "../controllers/collegeAuthControllers.js";

import { uploadCollegeDoc } from "../middleware/upload.js";
import { approveCollege } from "../controllers/collegeAuthControllers.js";
import { getAllColleges } from "../controllers/collegeAuthControllers.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", getAllColleges); // GET all colleges
router.patch("/approve-college/:id", approveCollege);
router.patch("/toggle-status/:id", toggleCollegeStatus);
router.delete("/:id", deleteCollege);

/**
 * @route   POST /api/college/signup
 * @desc    Signup college (with file upload)
 */
router.post("/signup", uploadCollegeDoc.single("document"), collegeSignup);

/**
 * @route   POST /api/college/login
 * @desc    Login college
 */
router.post("/login", collegeLogin);

/**
 * @route   GET /api/college/logout
 * @desc    Logout college
 */
router.get("/logout", collegeLogout);

/**
 * @route   GET /api/college/isCollege
 * @desc    Check if college is logged in
 */
router.get("/isCollege", isCollegeLoggedIn);

/**
 * @route   POST /api/college/send-otp
 * @desc    Send OTP to email for password reset
 */
router.post("/send-otp", sendCollegeOTP);

/**
 * @route   POST /api/college/reset-password
 * @desc    Reset password using OTP
 */
router.post("/reset-password", resetCollegePassword);

/**
 * @route   PUT /api/college/profile
 * @desc    Update college profile (with image upload)
 */
router.put(
  "/profile",
  requireAuth,
  uploadCollegeDoc.single("profileImage"),
  updateCollegeProfile
);

export default router;
