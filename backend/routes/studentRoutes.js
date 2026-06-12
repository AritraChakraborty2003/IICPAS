import Student from "../models/Students.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import uploadStudentImage from "../middleware/studentImageUpload.js";
import isStudent from "../middleware/isStudent.js";
import {
  deleteStudent,
  updateStudentStatus,
} from "../controllers/studentController.js";
import { requireAuth, requirePermission } from "../middleware/requireAuth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import Transaction from "../models/Transaction.js";
import CourseBooking from "../models/CourseBooking.js";

//FOR PDF Import
import PDFDocument from "pdfkit";
import Course from "../models/Content/Course.js";
import Quiz from "../models/Content/Quiz.js";
import fs from "fs-extra";
import nodemailer from "nodemailer";
import express from "express";
import CoinTransaction from "../models/CoinTransaction.js";
import {
  awardCoins,
  getCoinSettings,
  getStudentCoinSummary,
} from "../services/coinService.js";
import { recordLogin, recordLogout } from "../services/authAuditService.js";
import { isLoginAllowed } from "../services/loginAccessService.js";
import {
  ensureStudentReferralCode,
  generateUniqueReferralCode,
  normalizeReferralCode,
} from "../services/referralService.js";
import {
  transferStudentBatchSeat,
} from "../services/batchAssignmentService.js";
import {
  getDigitalHubCourseProgress,
  markDigitalHubCompletion,
} from "../services/digitalHubProgressService.js";
import {
  buildCourseAccessEntries,
  normalizeCourseAccessOverride,
  normalizeCourseAccessOverrides,
  upsertCourseAccessOverride,
} from "../utils/courseAccess.js";
import {
  isEmailConfigured,
  setupEmailInstructions,
} from "../config/emailConfig.js";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppRecipient,
} from "../config/whatsappConfig.js";
import { sendWhatsAppTemplateMessage } from "../services/whatsappService.js";

const WELCOME_WHATSAPP_TEMPLATE_NAME = "iicpa_welcome_message_1";

dotenv.config();

const createToken = (student) => {
  return jwt.sign(
    { id: student._id, role: "student" },
    process.env.JWT_SECRET || "default_jwt_secret_for_development",
    {
      expiresIn: "7d",
    }
  );
};

const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};

const router = express.Router();

const isTransactionUnsupportedError = (error) => {
  const message = String(error?.message || "");
  return (
    message.includes(
      "Transaction numbers are only allowed on a replica set member or mongos"
    ) ||
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set member or mongos")
  );
};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const registrationOtpStore = new Map();
const REGISTRATION_OTP_TTL_MS = 10 * 60 * 1000;
const REGISTRATION_WHATSAPP_TEMPLATE_NAME = "otp_template";
const HOMEPAGE_GATE_OTP_TTL_MS = 10 * 60 * 1000;
const HOMEPAGE_GATE_RESEND_COOLDOWN_MS = 30 * 1000;
const HOMEPAGE_GATE_WHATSAPP_TEMPLATE_NAME = "otp_template";
const homepageGateOtpStore = new Map();

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => normalizeWhatsAppRecipient(value);
const normalizeBooleanInput = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  }
  return null;
};
const getRegistrationOtpEntry = (email) => {
  const entry = registrationOtpStore.get(email);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    registrationOtpStore.delete(email);
    return null;
  }
  return entry;
};

const getHomepageGateOtpEntry = (phone) => {
  const entry = homepageGateOtpStore.get(phone);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    homepageGateOtpStore.delete(phone);
    return null;
  }
  return entry;
};

const sendHomepageGateOtp = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  homepageGateOtpStore.set(phone, {
    otp,
    expiresAt: Date.now() + HOMEPAGE_GATE_OTP_TTL_MS,
    lastSentAt: Date.now(),
  });

  await sendWhatsAppTemplateMessage({
    to: phone,
    templateName: HOMEPAGE_GATE_WHATSAPP_TEMPLATE_NAME,
    components: [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: otp,
          },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          {
            type: "text",
            text: otp,
          },
        ],
      },
    ],
  });
};

const ensureAuthorizedStudent = (req, res) => {
  if (!req.user?.id || req.user.id !== req.params.id) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
};

const objectIdEquals = (left, right) => {
  if (!left || !right) return false;
  return String(left) === String(right);
};

const isBlockedStudentStatus = (status) => {
  const normalized = String(status || "").toLowerCase();
  return normalized === "inactive" || normalized === "suspended";
};

const groupByStudentId = (records = []) =>
  records.reduce((acc, record) => {
    const studentId = String(record?.studentId || "");
    if (!studentId) return acc;

    if (!acc.has(studentId)) {
      acc.set(studentId, []);
    }

    acc.get(studentId).push(record);
    return acc;
  }, new Map());

const getDefaultCourseExpiry = (purchasedAt = new Date()) => {
  const date = purchasedAt instanceof Date ? new Date(purchasedAt) : new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
};

const syncCourseAccessOnEnrollment = async (student, courseId, purchasedAt) => {
  if (!student || !courseId) return;
  await upsertCourseAccessOverride({
    student,
    courseId,
    isLocked: false,
    purchasedAt,
    expiresAt: getDefaultCourseExpiry(purchasedAt),
  });
};

const sanitizeStudentResponse = (student) => {
  const payload = student?.toObject ? student.toObject() : { ...student };
  delete payload.password;
  delete payload.otp;
  delete payload.otpExpiry;
  return payload;
};

const sendWelcomeEmail = async ({ name, email }) => {
  if (!email) return;

  if (!isEmailConfigured()) {
    setupEmailInstructions();
    return;
  }

  await transporter.sendMail({
    from: `"IICPA Institute" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to IICPA Institute",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <div style="background: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to IICPA</h1>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <p style="margin: 0 0 12px 0;">Dear ${name || "Student"},</p>
          <p style="margin: 0 0 12px 0;">
            Thank you for registering with <strong>IICPA Institute</strong>.
            Your student account has been created successfully.
          </p>
          <p style="margin: 0 0 12px 0;">
            You can now log in and start exploring your courses, learning resources, and student dashboard.
          </p>
          <p style="margin: 0;">
            Regards,<br />
            Team IICPA
          </p>
        </div>
      </div>
    `,
  });
};

const formatBatchLabel = (batch) => {
  if (!batch) return "your assigned batch";

  const code = batch.code || batch.batchCode || "N/A";
  const mode = String(batch.mode || "").trim().toUpperCase();
  const size = Number(batch.size || 0);
  const assignedCount = Number(batch.assignedCount || 0);
  const capacity = size > 0 ? `${assignedCount}/${size}` : "N/A";

  return [code, mode, capacity].filter(Boolean).join(" | ");
};

const sendBatchAssignmentEmail = async ({ student, batch }) => {
  const email = String(student?.email || "").trim();
  if (!email || !batch) return;

  if (!isEmailConfigured()) {
    setupEmailInstructions();
    return;
  }

  const studentName = student?.name || "Student";
  const batchLabel = formatBatchLabel(batch);

  await transporter.sendMail({
    from: `"IICPA Institute" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Batch Assigned: ${batch.code || "IICPA Batch"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <div style="background: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: #3cd664;">IICPA Institute</h1>
          <p style="margin: 6px 0 0 0; font-size: 16px;">Batch Assignment Update</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <p style="margin: 0 0 12px 0;">Dear ${studentName},</p>
          <p style="margin: 0 0 12px 0;">
            You have been assigned to a new batch in your student account.
          </p>
          <div style="background: #ffffff; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Assigned Batch</p>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">${batchLabel}</p>
          </div>
          <p style="margin: 0 0 12px 0;">
            Please log in to your dashboard to view the batch details and next steps.
          </p>
          <p style="margin: 0;">
            Regards,<br />
            Team IICPA
          </p>
        </div>
      </div>
    `,
  });
};

//Register Student
router.post("/register/send-otp", async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const name = String(req.body.name || "").trim();

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    if (!isWhatsAppConfigured()) {
      return res.status(503).json({ message: "WhatsApp OTP is not configured" });
    }

    const existing = await Student.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    registrationOtpStore.set(phone, {
      otp,
      expiresAt: Date.now() + REGISTRATION_OTP_TTL_MS,
    });

    await sendWhatsAppTemplateMessage({
      to: phone,
      templateName: REGISTRATION_WHATSAPP_TEMPLATE_NAME,
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: otp,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: otp,
            },
          ],
        },
      ],
    });

    res.json({ message: "WhatsApp OTP sent" });
  } catch (err) {
    registrationOtpStore.delete(phone);
    console.error("Error sending registration OTP email:", err);
    res.status(500).json({ message: "Failed to send WhatsApp OTP" });
  }
});

router.post("/homepage-gate/send-otp", async (req, res) => {
  const phone = normalizePhone(req.body.phone);

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    if (!isWhatsAppConfigured()) {
      return res.status(503).json({ message: "WhatsApp OTP is not configured" });
    }

    const existing = getHomepageGateOtpEntry(phone);
    if (existing && Date.now() - existing.lastSentAt < HOMEPAGE_GATE_RESEND_COOLDOWN_MS) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP",
      });
    }

    await sendHomepageGateOtp(phone);

    res.json({ message: "WhatsApp OTP sent" });
  } catch (err) {
    homepageGateOtpStore.delete(phone);
    console.error("Error sending homepage gate OTP:", err);
    res.status(500).json({ message: "Failed to send WhatsApp OTP" });
  }
});

router.post("/homepage-gate/verify-otp", async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const submittedOtp = String(req.body.otp || "").trim();

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  if (!submittedOtp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  const entry = getHomepageGateOtpEntry(phone);
  if (!entry || entry.otp !== submittedOtp) {
    return res.status(400).json({ message: "OTP invalid or expired" });
  }

  homepageGateOtpStore.delete(phone);

  res.json({
    message: "Verification successful",
    verified: true,
  });
});

router.post("/register", async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    otp,
    mode,
    location,
    center,
    referralCode: rawReferralCode,
  } = req.body;

  try {
    const normalizedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = String(phone || "").trim();
    const normalizedWhatsAppPhone = normalizeWhatsAppRecipient(normalizedPhone);
    if (!normalizedName || !normalizedEmail || !normalizedPhone || !password) {
      return res.status(400).json({
        message: "Name, email, phone, and password are required",
      });
    }

    if (!normalizedWhatsAppPhone) {
      return res.status(400).json({
        message: "Please enter a valid WhatsApp mobile number",
      });
    }

    const existing = await Student.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedWhatsAppPhone }],
    });
    if (existing)
      return res.status(400).json({ message: "Email or phone already exists" });

    const submittedOtp = String(otp || "").trim();
    if (!submittedOtp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const storedOtp = getRegistrationOtpEntry(normalizedWhatsAppPhone);
    if (!storedOtp || storedOtp.otp !== submittedOtp) {
      return res.status(400).json({ message: "OTP invalid or expired" });
    }

    const normalizedReferralCode = normalizeReferralCode(rawReferralCode);
    let referrer = null;

    if (normalizedReferralCode) {
      referrer = await Student.findOne({
        referralCode: normalizedReferralCode,
      }).select("_id name referralCode");

      if (!referrer) {
        return res
          .status(400)
          .json({ message: "Referral code is invalid or expired" });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    let student = null;

    try {
      student = new Student({
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedWhatsAppPhone || normalizedPhone,
        password: hashed,
        mode: mode || null,
        location,
        center,
        batchId: null,
        batchCode: null,
        batchMode: null,
        batchAssignedAt: null,
        referralCode: await generateUniqueReferralCode(
          normalizedName || normalizedEmail
        ),
        referredBy: referrer?._id || null,
      });

      await student.save();
      registrationOtpStore.delete(normalizedWhatsAppPhone);
    } catch (saveError) {
      if (saveError?.code === 11000) {
        return res.status(400).json({
          message: "Email or phone already exists",
          error: "Register failed",
          details: "Email or phone already exists",
        });
      }

      throw saveError;
    }

    if (referrer?._id) {
      try {
        const settings = await getCoinSettings();
        await awardCoins({
          studentId: referrer._id.toString(),
          eventType: "REFERRAL_SIGNUP",
          coins: Number(settings?.referralSignupCoins || 0),
          metadata: {
            referredStudentId: student._id,
            referredStudentName: student.name,
            referredStudentEmail: student.email,
            referralCode: normalizedReferralCode,
          },
          idempotencyKey: `referral:${referrer._id}:${student._id}`,
        });
      } catch (coinError) {
        console.error("Referral coin award failed:", coinError);
      }
    }

    let welcomeEmailSent = true;
    try {
      await sendWelcomeEmail({ name: student.name, email: student.email });
    } catch (emailError) {
      welcomeEmailSent = false;
      console.error(
        `Failed to send welcome email to ${student.email}:`,
        emailError.message
      );
    }

    let welcomeWhatsAppSent = false;
    if (normalizedWhatsAppPhone && isWhatsAppConfigured()) {
      try {
        await sendWhatsAppTemplateMessage({
          to: normalizedWhatsAppPhone,
          templateName: WELCOME_WHATSAPP_TEMPLATE_NAME,
          bodyParameters: [
            {
              type: "text",
              text: student.name || "Student",
            },
          ],
        });
        welcomeWhatsAppSent = true;
      } catch (whatsAppError) {
        console.error(
          `Failed to send WhatsApp welcome message to ${student.phone}:`,
          whatsAppError.message
        );
      }
    }

    res.status(201).json({
      message: "Registered",
      student: sanitizeStudentResponse(student),
      batch: null,
      referralApplied: Boolean(referrer),
      welcomeEmailSent,
      welcomeWhatsAppSent,
    });
  } catch (err) {
    console.error("Student registration failed:", {
      message: err?.message,
      email: normalizeEmail(email),
      phone: normalizePhone(phone),
      stack: err?.stack,
    });

    if (err?.code === 11000) {
      return res.status(400).json({
        message: "Email or phone already exists",
        error: "Register failed",
        details: "Email or phone already exists",
      });
    }

    res.status(500).json({
      message: err?.message || "Register failed",
      error: "Register failed",
      details: err?.message || "Register failed",
    });
  }
});

// Get all students (for admin dashboard)
router.get("/", async (req, res) => {
  try {
    const students = await Student.find({})
      .populate("course", "title")
      .populate("enrolledLiveSessions", "title")
      .populate("enrolledRecordedSessions", "title")
      .populate("batchId", "code mode size assignedCount courseLocks")
      .select(
        "name email phone mode location center status batchId batchCode batchMode batchAssignedAt course enrolledLiveSessions enrolledRecordedSessions digitalHubAccessOverride courseAccessOverrides liveClassAccessEnabled receipts createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    if (!students.length) {
      return res.json({
        message: "Students retrieved successfully",
        students: [],
        count: 0,
      });
    }

    const studentIds = students.map((student) => student._id);
    const [bookings, transactions] = await Promise.all([
      CourseBooking.find({ studentId: { $in: studentIds } })
        .select("studentId courseId itemType paymentVerifiedAt payments updatedAt createdAt")
        .lean(),
      Transaction.find({ studentId: { $in: studentIds } })
        .select("studentId courseId status verifiedAt updatedAt createdAt")
        .lean(),
    ]);

    const bookingsByStudent = groupByStudentId(bookings);
    const transactionsByStudent = groupByStudentId(transactions);

    const studentsWithCourseAccess = students.map((student) => ({
      ...student,
      courseAccessOverrides: normalizeCourseAccessOverrides(student),
      course: buildCourseAccessEntries({
        student,
        courses: Array.isArray(student.course) ? student.course : [],
        bookings: bookingsByStudent.get(String(student._id)) || [],
        transactions: transactionsByStudent.get(String(student._id)) || [],
      }),
    }));

    res.json({
      message: "Students retrieved successfully",
      students: studentsWithCourseAccess,
      count: studentsWithCourseAccess.length,
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({
      message: "Failed to fetch students",
      error: err.message,
    });
  }
});

// Get student overview for admin details page
router.get(
  "/admin/:id/overview",
  requireAuth,
  requirePermission("students", "read"),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }

      const student = await Student.findById(id)
        .populate("course", "title")
        .populate("batchId", "code mode size assignedCount courseLocks")
        .select(
          "name email phone mode location center status batchId batchCode batchMode batchAssignedAt course courseAccessOverrides receipts createdAt updatedAt"
        )
        .lean();

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const [transactions, bookings] = await Promise.all([
        Transaction.find({ studentId: id })
          .populate("courseId", "title category price")
          .sort({ createdAt: -1 })
          .lean(),
        CourseBooking.find({ studentId: id })
          .populate("courseId", "title")
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      const courses = Array.isArray(student.course) ? student.course : [];
      const coursesWithAccess = buildCourseAccessEntries({
        student,
        courses,
        bookings,
        transactions,
      });
      const coursesWithCompletion = await Promise.all(
        coursesWithAccess.map(async (course) => {
          try {
            const progress = await getDigitalHubCourseProgress(id, course._id);
            return {
              ...course,
              _id: course._id,
              title: course.title || "Untitled Course",
              completionPercent: Number(progress?.overallProgress || 0),
            };
          } catch (error) {
            return {
              ...course,
              _id: course._id,
              title: course.title || "Untitled Course",
              completionPercent: 0,
            };
          }
        })
      );

      const overallCompletionPercent = coursesWithCompletion.length
        ? Math.round(
            coursesWithCompletion.reduce(
              (sum, course) => sum + Number(course.completionPercent || 0),
              0
            ) / coursesWithCompletion.length
          )
        : 0;

      return res.json({
        success: true,
        student: {
          ...student,
          courseAccessOverrides: normalizeCourseAccessOverrides(student),
        },
        courses: coursesWithCompletion,
        overallCompletionPercent,
        transactions,
        bookings,
        receipts: Array.isArray(student.receipts) ? student.receipts : [],
      });
    } catch (error) {
      console.error("Error fetching student admin overview:", error);
      return res.status(500).json({
        message: "Failed to fetch student overview",
        error: error.message,
      });
    }
  }
);

router.put(
  "/admin/course-access/:studentId/:courseId",
  requireAuth,
  isAdmin,
  async (req, res) => {
    try {
      const { studentId, courseId } = req.params;
      const { locked } = req.body || {};
      const normalizedLocked = normalizeBooleanInput(locked);

      if (
        !mongoose.Types.ObjectId.isValid(studentId) ||
        !mongoose.Types.ObjectId.isValid(courseId)
      ) {
        return res.status(400).json({ message: "Invalid student or course ID" });
      }

      if (normalizedLocked === null) {
        return res.status(400).json({
          message: "Invalid locked value. Expected true or false.",
        });
      }

      const student = await Student.findById(studentId).select(
        "course courseAccessOverrides name"
      );
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!student.course.some((id) => objectIdEquals(id, courseId))) {
        return res.status(404).json({ message: "Course not enrolled for this student" });
      }

      const override = await upsertCourseAccessOverride({
        student,
        courseId,
        isLocked: normalizedLocked,
      });
      const normalizedOverride = normalizeCourseAccessOverride(
        override,
        courseId
      );
      const refreshedStudent = await Student.findById(studentId)
        .select("name courseAccessOverrides")
        .lean();

      return res.json({
        success: true,
        message: normalizedLocked
          ? "Course locked successfully"
          : "Course unlocked successfully",
        override: normalizedOverride,
        student: {
          id: refreshedStudent?._id || student._id,
          name: refreshedStudent?.name || student.name,
          courseAccessOverrides: normalizeCourseAccessOverrides(
            refreshedStudent || student
          ),
        },
      });
    } catch (error) {
      console.error("Failed to update course access override:", error);
      return res.status(500).json({
        message: "Failed to update course access",
        error: error.message,
      });
    }
  }
);

router.put(
  "/admin/batch/:studentId",
  requireAuth,
  requirePermission("students", "update"),
  async (req, res) => {
    const session = await mongoose.startSession();

    try {
      const { studentId } = req.params;
      const { batchId } = req.body || {};

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }

      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID format" });
      }

      let transferResult = null;
      try {
        await session.withTransaction(async () => {
          transferResult = await transferStudentBatchSeat({
            studentId,
            targetBatchId: batchId,
            session,
          });
        });
      } catch (transactionError) {
        if (!isTransactionUnsupportedError(transactionError)) {
          throw transactionError;
        }

        console.warn(
          "MongoDB transactions are not supported on this deployment. Falling back to a non-transactional batch transfer."
        );

        transferResult = await transferStudentBatchSeat({
          studentId,
          targetBatchId: batchId,
        });
      }

      if (!transferResult?.student) {
        return res.status(500).json({
          message: "Failed to transfer student batch",
        });
      }

      if (transferResult.changed) {
        try {
          await sendBatchAssignmentEmail({
            student: transferResult.student,
            batch: transferResult.batch,
          });
        } catch (emailError) {
          console.error(
            `Failed to send batch assignment email to ${transferResult.student?.email || "student"}:`,
            emailError
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: transferResult.changed
          ? "Student batch updated successfully"
          : "Student is already assigned to this batch",
        student: sanitizeStudentResponse(transferResult.student),
        batch: transferResult.batch,
        previousBatch: transferResult.previousBatch,
      });
    } catch (error) {
      console.error("Error transferring student batch:", error);
      return res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || "Failed to transfer student batch",
        error: error?.message || "Failed to transfer student batch",
      });
    } finally {
      session.endSession();
    }
  }
);

//Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email });

    if (!student) return res.status(404).json({ message: "Not found" });
    if (isBlockedStudentStatus(student.status)) {
      return res.status(403).json({ message: "Account is suspended" });
    }

    const match = await bcrypt.compare(password, student.password);
    if (!match) return res.status(401).json({ message: "Wrong password" });
    const allowed = await isLoginAllowed("student", student._id);
    if (!allowed) return res.status(403).json({ message: "Account is inactive" });
    const token = createToken(student);

    await recordLogin({
      role: "student",
      actorModel: "Student",
      actorId: student._id,
      displayName: student.name,
      email: student.email,
      req,
      sessionExpiresAt: getTokenExpiry(token),
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // only HTTPS in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site, 'lax' for local dev
      })
      .json({ message: "Login success", student });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

router.get("/logout", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "default_jwt_secret_for_development"
        );
        if (decoded?.id) {
          const student = await Student.findById(decoded.id).select("_id name email");
          if (student) {
            await recordLogout({
              role: "student",
              actorModel: "Student",
              actorId: student._id,
              displayName: student.name,
              email: student.email,
              req,
            });
          }
        }
      } catch {
        // Continue clearing cookie even when token is invalid.
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch {
    res.status(200).json({ message: "Logged out successfully" });
  }
});

// isStudent
router.get("/isstudent", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ student: null });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_jwt_secret_for_development"
    );
    const student = await Student.findById(decoded.id).select(
      "-password -otp -otpExpiry"
    );
    if (!student) return res.status(404).json({ student: null });
    if (isBlockedStudentStatus(student.status)) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      return res.status(403).json({ student: null, message: "Account is suspended" });
    }

    // Self-heal: if any single-course booking is fully paid, ensure course enrollment exists.
    const fullyPaidBookings = await CourseBooking.find({
      studentId: student._id,
      itemType: "single_course",
      status: "fully_paid",
      remainingAmount: { $lte: 0 },
      courseId: { $ne: null },
    }).select("courseId sessionType");

    let enrollmentChanged = false;
    fullyPaidBookings.forEach((booking) => {
      if (!booking?.courseId) return;

      if (!student.course.some((id) => objectIdEquals(id, booking.courseId))) {
        student.course.push(booking.courseId);
        enrollmentChanged = true;
      }

      if (booking.sessionType === "live") {
        if (
          !student.enrolledLiveSessions.some((id) =>
            objectIdEquals(id, booking.courseId)
          )
        ) {
          student.enrolledLiveSessions.push(booking.courseId);
          enrollmentChanged = true;
        }
      } else {
        if (
          !student.enrolledRecordedSessions.some((id) =>
            objectIdEquals(id, booking.courseId)
          )
        ) {
          student.enrolledRecordedSessions.push(booking.courseId);
          enrollmentChanged = true;
        }
      }
    });

    if (enrollmentChanged) {
      await student.save();
    }

    res.json({
      student: {
        ...student.toObject(),
        coinBalance: student.coinBalance ?? 0,
      },
    });
  } catch {
    res.status(401).json({ student: null });
  }
});

// GET /api/v1/students/coins/:id - Get student's coin balance and recent transactions
router.get("/coins/:id", isStudent, async (req, res) => {
  try {
    if (!ensureAuthorizedStudent(req, res)) return;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const summary = await getStudentCoinSummary(req.params.id);
    if (!summary) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(summary);
  } catch (error) {
    console.error("Error fetching student coin summary:", error);
    return res.status(500).json({
      message: "Failed to fetch coin summary",
      error: error.message,
    });
  }
});

router.get("/referral-summary/:id", isStudent, async (req, res) => {
  try {
    if (!ensureAuthorizedStudent(req, res)) return;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(req.params.id).select(
      "name email referralCode referredBy referralBenefitsUsed coinBalance course"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const referralCode = await ensureStudentReferralCode(student);

    const [settings, referredCount, recentReferrals, rewardSummary, referrer] =
      await Promise.all([
        getCoinSettings(),
        Student.countDocuments({ referredBy: student._id }),
        Student.find({ referredBy: student._id })
          .select("name email createdAt")
          .sort({ createdAt: -1 })
          .limit(8),
        CoinTransaction.aggregate([
          {
            $match: {
              studentId: student._id,
              eventType: "REFERRAL_SIGNUP",
            },
          },
          {
            $group: {
              _id: null,
              totalCoins: { $sum: "$coins" },
            },
          },
        ]),
        student.referredBy
          ? Student.findById(student.referredBy).select("name referralCode")
          : null,
      ]);

    return res.json({
      referralCode,
      referralRewardCoins: Number(settings?.referralSignupCoins || 0),
      referralFirstPurchaseDiscountPercent: Number(
        settings?.referralUsageDiscountPercent || 0
      ),
      referralFirstPurchaseCoins: Number(settings?.referralUsageCoins || 0),
      referralPromoCode: String(settings?.referralPromoCode || ""),
      referralBenefitsUsed: Boolean(student.referralBenefitsUsed),
      referralFirstPurchaseEligible: !Boolean(student.referralBenefitsUsed),
      referredCount,
      totalReferralCoins: Number(rewardSummary?.[0]?.totalCoins || 0),
      currentCoinBalance: Number(student.coinBalance || 0),
      recentReferrals: recentReferrals.map((entry) => ({
        id: entry._id,
        name: entry.name || "Student",
        email: entry.email || "",
        joinedAt: entry.createdAt,
      })),
      referredBy: referrer
        ? {
            id: referrer._id,
            name: referrer.name || "",
            referralCode: referrer.referralCode || "",
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching referral summary:", error);
    return res.status(500).json({
      message: "Failed to fetch referral summary",
      error: error.message,
    });
  }
});

// POST /api/v1/students/revision-tests/:id/complete - Complete a revision test and earn coins once
router.post("/revision-tests/:id/complete", isStudent, async (req, res) => {
  try {
    if (!ensureAuthorizedStudent(req, res)) return;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const { testId, score, totalQuestions } = req.body;
    if (!testId) {
      return res.status(400).json({ message: "testId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid test ID format" });
    }

    const settings = await getCoinSettings();
    const idempotencyKey = `quiz:${req.params.id}:${testId}`;
    const awardResult = await awardCoins({
      studentId: req.params.id,
      eventType: "QUIZ_COMPLETE",
      coins: settings.quizCompleteCoins,
      metadata: {
        testId,
        score,
        totalQuestions,
      },
      idempotencyKey,
    });

    return res.json({
      message:
        awardResult.awarded
          ? "Quiz completed and coins awarded"
          : "Quiz already rewarded",
      status: awardResult.awarded ? "awarded" : "already_awarded",
      coinBalance: awardResult.coinBalance ?? 0,
      coinsAwarded: awardResult.awarded ? settings.quizCompleteCoins : 0,
    });
  } catch (error) {
    console.error("Error completing revision test:", error);
    return res.status(500).json({
      message: "Failed to complete revision test",
      error: error.message,
    });
  }
});

// POST /api/v1/students/digital-hub-quizzes/:id/complete - Award coins per correct answer
router.post("/digital-hub-quizzes/:id/complete", isStudent, async (req, res) => {
  try {
    if (!ensureAuthorizedStudent(req, res)) return;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const { quizId, topicId, selectedAnswers, totalQuestions } = req.body || {};
    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Valid quizId is required" });
    }

    if (!selectedAnswers || typeof selectedAnswers !== "object") {
      return res
        .status(400)
        .json({ message: "selectedAnswers map is required" });
    }

    const quiz = await Quiz.findById(quizId).select("topic questions");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const normalizedSelectedAnswers = selectedAnswers || {};
    const correctQuestionIds = (quiz.questions || [])
      .filter((question) => {
        const selected = normalizedSelectedAnswers[String(question._id)];
        return typeof selected === "string" && selected === question.answer;
      })
      .map((question) => String(question._id));

    if (correctQuestionIds.length === 0) {
      const summary = await getStudentCoinSummary(req.params.id, 1);
      return res.json({
        message: "No correct answers in this attempt",
        status: "no_correct_answers",
        coinAwarded: false,
        coinsAwarded: 0,
        correctAnswers: 0,
        totalQuestions: Number(totalQuestions) || quiz.questions.length || 0,
        coinBalance: summary?.coinBalance ?? 0,
      });
    }

    const settings = await getCoinSettings();
    const coinsPerCorrect = Number(settings?.quizCompleteCoins || 0);
    if (!Number.isFinite(coinsPerCorrect) || coinsPerCorrect <= 0) {
      const summary = await getStudentCoinSummary(req.params.id, 1);
      return res.json({
        message: "Quiz coins are disabled in settings",
        status: "coins_disabled",
        coinAwarded: false,
        coinsAwarded: 0,
        correctAnswers: correctQuestionIds.length,
        totalQuestions: Number(totalQuestions) || quiz.questions.length || 0,
        coinBalance: summary?.coinBalance ?? 0,
      });
    }

    let awardedCount = 0;
    let latestBalance = 0;

    for (const questionId of correctQuestionIds) {
      const awardResult = await awardCoins({
        studentId: req.params.id,
        eventType: "QUIZ_COMPLETE",
        coins: coinsPerCorrect,
        metadata: {
          quizId,
          topicId: topicId || String(quiz.topic),
          questionId,
          coinRule: "per_correct_answer",
          totalQuestions: Number(totalQuestions) || quiz.questions.length || 0,
        },
        idempotencyKey: `quiz_correct:${req.params.id}:${quizId}:${questionId}`,
      });

      if (awardResult.awarded) {
        awardedCount += 1;
      }
      latestBalance = awardResult.coinBalance ?? latestBalance;
    }

    return res.json({
      message:
        awardedCount > 0
          ? "Coins awarded for correct answers"
          : "Correct answers already rewarded",
      status: awardedCount > 0 ? "awarded" : "already_awarded",
      coinAwarded: awardedCount > 0,
      coinsAwarded: awardedCount * coinsPerCorrect,
      coinsPerCorrect,
      awardedCorrectAnswers: awardedCount,
      correctAnswers: correctQuestionIds.length,
      totalQuestions: Number(totalQuestions) || quiz.questions.length || 0,
      coinBalance: latestBalance,
    });
  } catch (error) {
    console.error("Error completing digital hub quiz:", error);
    return res.status(500).json({
      message: "Failed to process quiz rewards",
      error: error.message,
    });
  }
});

router.get("/:id/digital-hub-progress/:courseId", isStudent, async (req, res) => {
  try {
    if (!ensureAuthorizedStudent(req, res)) return;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const progress = await getDigitalHubCourseProgress(
      req.params.id,
      req.params.courseId
    );

    if (!progress) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({
      success: true,
      ...progress,
    });
  } catch (error) {
    console.error("Error fetching digital hub progress:", error);
    return res.status(500).json({
      message: "Failed to fetch digital hub progress",
      error: error.message,
    });
  }
});

router.post(
  "/:id/digital-hub-progress/:courseId/topics/:topicId/complete",
  isStudent,
  async (req, res) => {
    try {
      if (!ensureAuthorizedStudent(req, res)) return;

      const { id, courseId, topicId } = req.params;
      const { chapterId } = req.body || {};

      if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(topicId) ||
        !mongoose.Types.ObjectId.isValid(chapterId)
      ) {
        return res.status(400).json({ message: "Valid IDs are required" });
      }

      const progress = await markDigitalHubCompletion({
        studentId: id,
        courseId,
        chapterId,
        itemId: topicId,
        itemType: "topic",
      });

      return res.json({
        success: true,
        message: "Topic marked as completed",
        ...progress,
      });
    } catch (error) {
      console.error("Error marking topic completion:", error);
      return res.status(error.status || 500).json({
        message: error.message || "Failed to mark topic completion",
      });
    }
  }
);

router.post(
  "/:id/digital-hub-progress/:courseId/assignments/:assignmentId/complete",
  isStudent,
  async (req, res) => {
    try {
      if (!ensureAuthorizedStudent(req, res)) return;

      const { id, courseId, assignmentId } = req.params;
      const { chapterId } = req.body || {};

      if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(assignmentId) ||
        !mongoose.Types.ObjectId.isValid(chapterId)
      ) {
        return res.status(400).json({ message: "Valid IDs are required" });
      }

      const progress = await markDigitalHubCompletion({
        studentId: id,
        courseId,
        chapterId,
        itemId: assignmentId,
        itemType: "assignment",
      });

      return res.json({
        success: true,
        message: "Assignment marked as completed",
        ...progress,
      });
    } catch (error) {
      console.error("Error marking assignment completion:", error);
      return res.status(error.status || 500).json({
        message: error.message || "Failed to mark assignment completion",
      });
    }
  }
);

router.post(
  "/:id/digital-hub-progress/:courseId/question-sets/:questionSetId/complete",
  isStudent,
  async (req, res) => {
    try {
      if (!ensureAuthorizedStudent(req, res)) return;

      const { id, courseId, questionSetId } = req.params;
      const { chapterId } = req.body || {};

      if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(questionSetId) ||
        !mongoose.Types.ObjectId.isValid(chapterId)
      ) {
        return res.status(400).json({ message: "Valid IDs are required" });
      }

      const progress = await markDigitalHubCompletion({
        studentId: id,
        courseId,
        chapterId,
        itemId: questionSetId,
        itemType: "questionSet",
      });

      return res.json({
        success: true,
        message: "Question set marked as completed",
        ...progress,
      });
    } catch (error) {
      console.error("Error marking question set completion:", error);
      return res.status(error.status || 500).json({
        message: error.message || "Failed to mark question set completion",
      });
    }
  }
);

/*---- Course buy Routes ----- */
const generateReceiptPDF = async (student, course, receiptId) => {
  const doc = new PDFDocument();
  const filePath = `./receipts/${receiptId}.pdf`;
  await fs.ensureDir("./receipts");
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("Course Receipt", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Receipt ID: ${receiptId}`);
  doc.text(`Name: ${student.name}`);
  doc.text(`Email: ${student.email}`);
  doc.text(`Course: ${course.title}`);
  doc.text(`Amount Paid: Rs. ${course.price}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);

  doc.end();
  return filePath;
};

const sendReceiptEmail = async (email, pdfPath) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"LMS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Course Purchase Receipt",
    text: "Thank you for your purchase. Find the receipt attached.",
    attachments: [{ filename: "receipt.pdf", path: pdfPath }],
  });
};

// === POST /course-buy/:studentId ===

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const student = await Student.findOne({ email });
  if (!student) return res.status(404).json({ message: "Student not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  student.otp = otp;
  student.otpExpiry = Date.now() + 10 * 60 * 1000;
  await student.save();

  try {
    await transporter.sendMail({
      from: `"Codemap LMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Password Reset",
      html: `<p>Hello ${student.name},</p><p>Your OTP is <b>${otp}</b>. It will expire in 10 minutes.</p>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Error sending OTP email:", err);
    res.status(500).json({ message: "Failed to send OTP email" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const student = await Student.findOne({ email, otp });

  if (!student || student.otpExpiry < Date.now())
    return res.status(400).json({ message: "OTP invalid or expired" });

  student.password = newPassword; // hash in production
  student.otp = undefined;
  student.otpExpiry = undefined;
  await student.save();

  res.json({ message: "Password reset successful" });
});

router.post("/course-buy/:id", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    if (decoded.id !== req.params.id)
      return res.status(403).json({ message: "Forbidden" });

    const student = await Student.findById(req.params.id);

    // Handle course lookup by both ObjectId and slug
    let course;
    const courseId = req.body.courseId;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(courseId);

    if (isValidObjectId) {
      course = await Course.findById(courseId);
    } else {
      course = await Course.findOne({ slug: courseId });
    }

    if (!student || !course)
      return res.status(404).json({ message: "Student or course not found" });

    const orderId = `ORDER-${Date.now()}`;
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: student._id.toString(),
      amount: course.price * 100,
      redirectUrl: `${process.env.PHONEPE_CALLBACK_URL}/${student._id}?courseId=${course._id}`,
      redirectMode: "POST",
      callbackUrl: `${process.env.PHONEPE_CALLBACK_URL}/${student._id}?courseId=${course._id}`,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );
    const checksum =
      base64Payload + "/pg/v1/pay" + process.env.PHONEPE_SALT_KEY;
    const xVerify =
      crypto.createHash("sha256").update(checksum).digest("hex") + "###1";

    const phonepeRes = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
        },
      }
    );

    const redirectUrl =
      phonepeRes.data.data.instrumentResponse.redirectInfo.url;
    res.json({ redirectUrl });
  } catch (err) {
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
});

// === POST /verify-buy/:studentId ===
router.post("/verify-buy/:id", async (req, res) => {
  const courseId = req.query.courseId;
  const { merchantUserId, code } = req.body.data;

  if (code !== "PAYMENT_SUCCESS") {
    return res.status(400).json({ message: "Payment failed" });
  }

  try {
    const student = await Student.findById(req.params.id);
    const course = await Course.findById(courseId);

    if (!student || !course)
      return res.status(404).json({ message: "Invalid student or course" });

    // Add course if not already bought
    if (!student.course.includes(courseId)) {
      student.course.push(courseId);
    }
    await syncCourseAccessOnEnrollment(student, course._id, new Date());

    // Enroll student in recorded sessions (course content)
    if (!student.enrolledRecordedSessions.includes(courseId)) {
      student.enrolledRecordedSessions.push(courseId);
    }

    // Check if this course has live sessions and enroll student
    const LiveSession = (
      await import("../../models/LiveSession/LiveSession.js")
    ).default;
    const courseLiveSessions = await LiveSession.find({
      category: course.category || "CA Foundation",
    });

    // Enroll student in all live sessions for this course category
    for (const session of courseLiveSessions) {
      if (!student.enrolledLiveSessions.includes(session._id)) {
        student.enrolledLiveSessions.push(session._id);
      }
    }

    // Generate + email receipt
    const receiptId = `R-${Date.now()}`;
    const pdfPath = await generateReceiptPDF(student, course, receiptId);
    await sendReceiptEmail(student.email, pdfPath);

    // Save receipt
    student.receipts.push({ id: receiptId, file: pdfPath });
    await student.save();

    // Non-blocking coin award on purchase success
    try {
      const settings = await getCoinSettings();
      const merchantTransactionId =
        req.body?.data?.merchantTransactionId || receiptId;
      await awardCoins({
        studentId: student._id.toString(),
        eventType: "PURCHASE_SUCCESS",
        coins: settings.purchaseSuccessCoins,
        metadata: {
          courseId: course._id.toString(),
          receiptId,
          merchantTransactionId,
        },
        idempotencyKey: `purchase:${student._id}:${course._id}:${merchantTransactionId}`,
      });
    } catch (coinError) {
      console.error("Purchase coin reward failed:", coinError);
    }

    res.redirect("/payment-success"); // Or res.json({ message: "Verified" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
});

// --- GET /list-receipts/:studentId ---
router.get("/list-receipts/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ receipts: student.receipts });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch receipts", error: err.message });
  }
});

// --- Serve/download receipt file ---
router.get("/download-receipt/:receiptId", async (req, res) => {
  try {
    const { receiptId } = req.params;
    const filePath = path.resolve(`./receipts/${receiptId}.pdf`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.download(filePath, `receipt-${receiptId}.pdf`);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to download receipt", error: err.message });
  }
});

router.post("/session-buy/:id", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    if (decoded.id !== req.params.id)
      return res.status(403).json({ message: "Forbidden" });

    const student = await Student.findById(req.params.id);
    const session = await LiveSession.findById(req.body.sessionId);
    if (!student || !session)
      return res.status(404).json({ message: "Invalid data" });

    const orderId = `SESSION-${Date.now()}`;
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: student._id.toString(),
      amount: session.price * 100,
      redirectUrl: `${process.env.PHONEPE_CALLBACK_URL}/${student._id}?sessionId=${session._id}`,
      redirectMode: "POST",
      callbackUrl: `${process.env.PHONEPE_CALLBACK_URL}/${student._id}?sessionId=${session._id}`,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = base64 + "/pg/v1/pay" + process.env.PHONEPE_SALT_KEY;
    const xVerify =
      crypto.createHash("sha256").update(checksum).digest("hex") + "###1";

    const payRes = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: base64 },
      {
        headers: {
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      redirectUrl: payRes.data.data.instrumentResponse.redirectInfo.url,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Verufy session buy

router.post("/verify-session-buy/:id", async (req, res) => {
  const { code, merchantUserId } = req.body.data;
  const sessionId = req.query.sessionId;

  if (code !== "PAYMENT_SUCCESS") {
    return res.status(400).json({ message: "Payment failed" });
  }

  try {
    const student = await Student.findById(req.params.id);
    const session = await LiveSession.findById(sessionId);
    if (!student || !session)
      return res.status(404).json({ message: "Invalid session or student" });

    const receiptId = `SESSION-R-${Date.now()}`;
    const pdfPath = await generateReceiptPDF(
      student,
      {
        title: session.title,
        price: session.price,
      },
      receiptId
    );
    await sendReceiptEmail(student.email, pdfPath);

    student.receipts.push({ id: receiptId, file: pdfPath });
    await student.save();

    res.redirect("/payment-success");
  } catch (err) {
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
});

router.get("/get-cart/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate({
      path: "cart.courseId",
      model: "Course",
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    // Transform cart data to include course details
    const cartWithCourseDetails = student.cart.map((cartItem) => ({
      courseId: cartItem.courseId,
      sessionType: cartItem.sessionType,
      quantity: cartItem.quantity || 1,
      course: cartItem.courseId, // This will contain the populated course data
    }));

    res.json({ cart: cartWithCourseDetails });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

//Ticket By Id

router.post("/ticket/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { message } = req.body;
    if (!message)
      return res.status(400).json({ message: "Message is required" });

    const ticket = new Ticket({
      name: student.name,
      email: student.email,
      phone: student.phone,
      message,
      resolve: "",
    });

    await ticket.save();
    res.json({ message: "Ticket submitted", ticket });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Ticket creation failed", error: err.message });
  }
});

const updateStudentProfile = async (req, res) => {
  try {
    console.log("Profile update request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("Request cookies:", req.cookies);

    const token = req.cookies.token;
    if (!token) {
      console.log("No token found in cookies");
      return res.status(401).json({ message: "Unauthorized - No token found" });
    }

    console.log("Token found, verifying...");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_jwt_secret_for_development"
    );
    console.log("Token decoded:", decoded);

    const student = await Student.findById(decoded.id);
    if (!student) {
      console.log("Student not found with ID:", decoded.id);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log("Student found:", student.name);

    // Handle image upload
    if (req.file) {
      console.log("Image file received:", req.file.filename);
      student.image = req.file.path;
    } else {
      console.log("No image file in request");
    }

    await student.save();
    console.log("Student saved successfully");

    res.json({
      message: "Profile updated successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        image: student.image,
        mode: student.mode,
        location: student.location,
        center: student.center,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

// Profile update route with image upload support
router.put("/profile", uploadStudentImage.single("profileImage"), updateStudentProfile);

// POST alias to avoid CORS preflight issues on some deployments
router.post("/profile", uploadStudentImage.single("profileImage"), updateStudentProfile);

// Superadmin route to update student profile details (excluding profile image)
router.put(
  "/admin/update-profile/:studentId",
  requireAuth,
  isAdmin,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { name, email, phone, mode, location, center, password } = req.body;

      // Find the student
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if email is being changed and if it already exists
      if (email && email !== student.email) {
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Update allowed fields (excluding profile image)
      if (name) student.name = name;
      if (email) student.email = email;
      if (phone) student.phone = phone;
      if (mode) student.mode = mode;
      if (location) student.location = location;
      if (center) student.center = center;

      // Handle password update if provided
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        student.password = hashed;
      }

      await student.save();

      res.json({
        message: "Student profile updated successfully",
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          mode: student.mode,
          location: student.location,
          center: student.center,
          digitalHubAccessOverride: student.digitalHubAccessOverride ?? false,
          image: student.image, // Include image for reference but it wasn't updated
        },
      });
    } catch (err) {
      console.error("Superadmin profile update error:", err);
      res.status(500).json({ message: "Update failed", error: err.message });
    }
  }
);

router.put(
  "/admin/digital-hub-access/:studentId",
  requireAuth,
  isAdmin,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { unlocked } = req.body || {};
      const normalizedUnlocked = normalizeBooleanInput(unlocked);

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }

      if (normalizedUnlocked === null) {
        return res.status(400).json({
          message: "Invalid unlocked value. Expected true or false.",
        });
      }

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      student.digitalHubAccessOverride = normalizedUnlocked;
      await student.save();

      return res.json({
        success: true,
        message: student.digitalHubAccessOverride
          ? "Digital Hub access unfrozen for this student"
          : "Digital Hub access restored to normal lock order",
        student: {
          id: student._id,
          name: student.name,
          digitalHubAccessOverride: Boolean(student.digitalHubAccessOverride),
        },
      });
    } catch (err) {
      console.error("Superadmin digital hub access update error:", err);
      return res.status(500).json({
        message: "Failed to update Digital Hub access",
        error: err.message,
      });
    }
  }
);

// Toggle live class access for a student
router.put(
  "/admin/live-class-access/:studentId",
  requireAuth,
  isAdmin,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { enabled } = req.body || {};
      const normalizedEnabled = normalizeBooleanInput(enabled);

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }

      if (normalizedEnabled === null) {
        return res.status(400).json({
          message: "Invalid enabled value. Expected true or false.",
        });
      }

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      student.liveClassAccessEnabled = normalizedEnabled;
      await student.save();

      return res.json({
        success: true,
        message: student.liveClassAccessEnabled
          ? "Live Class access enabled for this student"
          : "Live Class access disabled for this student",
        student: {
          id: student._id,
          name: student.name,
          liveClassAccessEnabled: Boolean(student.liveClassAccessEnabled),
        },
      });
    } catch (err) {
      console.error("Live class access update error:", err);
      return res.status(500).json({
        message: "Failed to update Live Class access",
        error: err.message,
      });
    }
  }
);

// Legacy profile update route (keeping for backward compatibility)
router.patch("/student/profile/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { phone, mode, location, center, password } = req.body;

    // Allow only certain fields to update
    if (phone) student.phone = phone;
    if (mode) student.mode = mode;
    if (location) student.location = location;
    if (center) student.center = center;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      student.password = hashed;
    }

    await student.save();
    res.json({ message: "Profile updated successfully", student });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

router.post("/add-to-cart/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { courseId, sessionType, quantity = 1 } = req.body;
    if (!courseId)
      return res.status(400).json({ message: "courseId is required" });
    if (!sessionType || !["recorded", "live"].includes(sessionType))
      return res.status(400).json({
        message: "sessionType is required and must be 'recorded' or 'live'",
      });

    // Check if this course with this session type is already in cart
    const existingCartItem = student.cart.find(
      (item) =>
        item.courseId &&
        item.courseId.toString() === courseId &&
        item.sessionType === sessionType
    );

    if (existingCartItem) {
      // Increase quantity instead of returning error
      existingCartItem.quantity = (existingCartItem.quantity || 1) + quantity;
      await student.save();

      return res.json({
        message: "Cart quantity updated",
        cart: student.cart,
        updatedItem: existingCartItem,
      });
    }

    // Add new item to cart
    student.cart.push({ courseId, sessionType, quantity });
    await student.save();

    res.json({ message: "Course added to cart", cart: student.cart });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add to cart", error: err.message });
  }
});

// Update cart item quantity
router.post("/update-cart-quantity/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { courseId, sessionType, quantity } = req.body;
    if (!courseId || !sessionType || quantity === undefined) {
      return res.status(400).json({
        message: "courseId, sessionType, and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Find the cart item
    const cartItem = student.cart.find(
      (item) =>
        item.courseId &&
        item.courseId.toString() === courseId &&
        item.sessionType === sessionType
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await student.save();

    res.json({
      message: "Cart quantity updated",
      cart: student.cart,
      updatedItem: cartItem,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update cart quantity",
      error: err.message,
    });
  }
});

router.post("/remove-cart/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { courseId, sessionType } = req.body;
    if (!courseId)
      return res.status(400).json({ message: "courseId is required" });
    if (!sessionType || !["recorded", "live"].includes(sessionType))
      return res.status(400).json({
        message: "sessionType is required and must be 'recorded' or 'live'",
      });

    const initialLength = student.cart.length;
    student.cart = student.cart.filter(
      (item) =>
        !(
          item.courseId &&
          item.courseId.toString() === courseId &&
          item.sessionType === sessionType
        )
    );

    if (student.cart.length === initialLength) {
      return res
        .status(404)
        .json({ message: "Course with this session type not in cart" });
    }

    await student.save();

    res.json({ message: "Course removed from cart", cart: student.cart });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to remove from cart", error: err.message });
  }
});

router.delete("/clear-cart/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.cart = [];
    await student.save();

    res.json({ message: "Cart cleared successfully", cart: [] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to clear cart", error: err.message });
  }
});

router.get("/student/:id/courses", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("course");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ enrolledCourses: student.course });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch courses", error: err.message });
  }
});

// GET /api/v1/students/list-courses/:id
router.get("/list-courses/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const enrolledCourses = await Course.find({
      _id: { $in: student.courses },
    }).populate({
      path: "chapters",
      populate: {
        path: "topics",
        populate: {
          path: "quiz",
        },
      },
    });

    res.json({ courses: enrolledCourses });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch enrolled courses",
      error: err.message,
    });
  }
});

// POST /api/v1/students/add-course/:id - Add course to student's enrolled courses
router.post("/add-course/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if course is already enrolled
    if (student.course.includes(courseId)) {
      return res
        .status(400)
        .json({ message: "Student is already enrolled in this course" });
    }

    // Add course to student's enrolled courses
    student.course.push(courseId);
    await syncCourseAccessOnEnrollment(student, courseId, new Date());
    await student.save();

    res.json({
      message: "Course added to student successfully",
      studentId: student._id,
      courseId: courseId,
      enrolledCourses: student.course,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to add course to student",
      error: err.message,
    });
  }
});

// POST /api/v1/students/add-wishlist/:id - Add course to student's wishlist
router.post("/add-wishlist/:id", isStudent, async (req, res) => {
  try {
    console.log("Add wishlist request:", {
      studentId: req.params.id,
      courseId: req.body.courseId,
      user: req.user,
    });

    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    const { courseId } = req.body;
    if (!courseId) {
      console.log("Missing courseId in request body");
      return res.status(400).json({ message: "courseId is required" });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if course is already in wishlist
    if (student.wishlist.includes(courseId)) {
      console.log("Course already in wishlist:", courseId);
      return res.status(400).json({ message: "Course is already in wishlist" });
    }

    // Add course to student's wishlist
    student.wishlist.push(courseId);
    await student.save();

    console.log("Course added to wishlist successfully:", {
      studentId: student._id,
      courseId: courseId,
      wishlistLength: student.wishlist.length,
    });

    res.json({
      message: "Course added to wishlist successfully",
      studentId: student._id,
      courseId: courseId,
      wishlist: student.wishlist,
    });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({
      message: "Failed to add course to wishlist",
      error: err.message,
    });
  }
});

// POST /api/v1/students/remove-wishlist/:id - Remove course from student's wishlist
router.post("/remove-wishlist/:id", isStudent, async (req, res) => {
  try {
    console.log("Remove wishlist request:", {
      studentId: req.params.id,
      courseId: req.body.courseId,
      user: req.user,
    });

    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    const { courseId } = req.body;
    if (!courseId) {
      console.log("Missing courseId in request body");
      return res.status(400).json({ message: "courseId is required" });
    }

    // Check if course is in wishlist
    if (!student.wishlist.includes(courseId)) {
      console.log("Course not in wishlist:", courseId);
      return res.status(400).json({ message: "Course is not in wishlist" });
    }

    // Remove course from student's wishlist
    student.wishlist = student.wishlist.filter(
      (id) => id.toString() !== courseId
    );
    await student.save();

    console.log("Course removed from wishlist successfully:", {
      studentId: student._id,
      courseId: courseId,
      wishlistLength: student.wishlist.length,
    });

    res.json({
      message: "Course removed from wishlist successfully",
      studentId: student._id,
      courseId: courseId,
      wishlist: student.wishlist,
    });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({
      message: "Failed to remove course from wishlist",
      error: err.message,
    });
  }
});

// GET /api/v1/students/get-wishlist/:id - Get student's wishlist
router.get("/get-wishlist/:id", isStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("wishlist");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Wishlist retrieved successfully",
      studentId: student._id,
      wishlist: student.wishlist,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to get wishlist",
      error: err.message,
    });
  }
});

// POST /api/v1/students/enroll-live-session/:id - Enroll student in live session
router.post("/enroll-live-session/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    // Check if live session exists
    const LiveSession = (
      await import("../../models/LiveSession/LiveSession.js")
    ).default;
    const liveSession = await LiveSession.findById(sessionId);
    if (!liveSession) {
      return res.status(404).json({ message: "Live session not found" });
    }

    // Check if student is already enrolled
    if (student.enrolledLiveSessions.includes(sessionId)) {
      return res
        .status(400)
        .json({ message: "Student is already enrolled in this live session" });
    }

    // Add live session to student's enrolled sessions
    student.enrolledLiveSessions.push(sessionId);
    await student.save();

    res.json({
      message: "Student enrolled in live session successfully",
      studentId: student._id,
      sessionId: sessionId,
      enrolledLiveSessions: student.enrolledLiveSessions,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to enroll student in live session",
      error: err.message,
    });
  }
});

// GET /api/v1/students/enrolled-live-sessions/:id - Get student's enrolled live sessions
router.get("/enrolled-live-sessions/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "enrolledLiveSessions"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Enrolled live sessions retrieved successfully",
      studentId: student._id,
      enrolledLiveSessions: student.enrolledLiveSessions,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to get enrolled live sessions",
      error: err.message,
    });
  }
});

// POST /api/v1/students/enroll-recorded-session/:id - Enroll student in recorded session (course)
router.post("/enroll-recorded-session/:id", async (req, res) => {
  try {
    console.log("Enrollment request received:", {
      studentId: req.params.id,
      courseId: req.body.courseId,
      body: req.body,
    });

    // Validate student ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid student ID format:", req.params.id);
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    const { courseId } = req.body;
    if (!courseId) {
      console.log("Course ID missing from request body");
      return res.status(400).json({ message: "courseId is required" });
    }

    // Validate course ID format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log("Invalid course ID format:", courseId);
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if student is already enrolled in recorded sessions
    if (student.enrolledRecordedSessions.includes(courseId)) {
      console.log("Student already enrolled in course:", courseId);
      return res.status(400).json({
        message: "Student is already enrolled in this recorded session",
      });
    }

    // Add course to student's enrolled recorded sessions
    student.enrolledRecordedSessions.push(courseId);
    await syncCourseAccessOnEnrollment(student, courseId, new Date());
    await student.save();

    console.log("Enrollment successful:", {
      studentId: student._id,
      courseId: courseId,
    });

    res.json({
      message: "Student enrolled in recorded session successfully",
      studentId: student._id,
      courseId: courseId,
      enrolledRecordedSessions: student.enrolledRecordedSessions,
    });
  } catch (err) {
    console.error("Enrollment error:", err);
    res.status(500).json({
      message: "Failed to enroll student in recorded session",
      error: err.message,
    });
  }
});

// GET /api/v1/students/enrolled-recorded-sessions/:id - Get student's enrolled recorded sessions
router.get("/enrolled-recorded-sessions/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "enrolledRecordedSessions"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Enrolled recorded sessions retrieved successfully",
      studentId: student._id,
      enrolledRecordedSessions: student.enrolledRecordedSessions,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to get enrolled recorded sessions",
      error: err.message,
    });
  }
});

// POST /api/v1/students/enroll-recorded-session-center/:id - Enroll student in recorded session + center
router.post("/enroll-recorded-session-center/:id", async (req, res) => {
  try {
    console.log("Center enrollment request received:", {
      studentId: req.params.id,
      courseId: req.body.courseId,
      body: req.body,
    });

    // Validate student ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid student ID format:", req.params.id);
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    const { courseId } = req.body;
    if (!courseId) {
      console.log("Course ID missing from request body");
      return res.status(400).json({ message: "courseId is required" });
    }

    // Validate course ID format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log("Invalid course ID format:", courseId);
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if student is already enrolled in recorded sessions + center
    if (
      student.enrolledRecordedSessionsCenter &&
      student.enrolledRecordedSessionsCenter.includes(courseId)
    ) {
      console.log("Student already enrolled in course + center:", courseId);
      return res.status(400).json({
        message:
          "Student is already enrolled in this recorded session + center",
      });
    }

    // Add course to student's enrolled recorded sessions + center
    if (!student.enrolledRecordedSessionsCenter) {
      student.enrolledRecordedSessionsCenter = [];
    }
    student.enrolledRecordedSessionsCenter.push(courseId);

    // Also add to regular recorded sessions if not already enrolled
    if (!student.enrolledRecordedSessions.includes(courseId)) {
      student.enrolledRecordedSessions.push(courseId);
    }

    await syncCourseAccessOnEnrollment(student, courseId, new Date());
    await student.save();

    console.log("Center enrollment successful:", {
      studentId: student._id,
      courseId: courseId,
    });

    res.json({
      message: "Student enrolled in recorded session + center successfully",
      studentId: student._id,
      courseId: courseId,
      enrolledRecordedSessionsCenter: student.enrolledRecordedSessionsCenter,
    });
  } catch (err) {
    console.error("Center enrollment error:", err);
    res.status(500).json({
      message: "Failed to enroll student in recorded session + center",
      error: err.message,
    });
  }
});

// POST /api/v1/students/enroll-live-session-center/:id - Enroll student in live session + center
router.post("/enroll-live-session-center/:id", async (req, res) => {
  try {
    console.log("Live session + center enrollment request received:", {
      studentId: req.params.id,
      courseId: req.body.courseId,
      body: req.body,
    });

    // Validate student ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid student ID format:", req.params.id);
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    const { courseId } = req.body;
    if (!courseId) {
      console.log("Course ID missing from request body");
      return res.status(400).json({ message: "courseId is required" });
    }

    // Validate course ID format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log("Invalid course ID format:", courseId);
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if student is already enrolled in live sessions + center
    if (
      student.enrolledLiveSessionsCenter &&
      student.enrolledLiveSessionsCenter.includes(courseId)
    ) {
      console.log(
        "Student already enrolled in live session + center:",
        courseId
      );
      return res.status(400).json({
        message: "Student is already enrolled in this live session + center",
      });
    }

    // Add course to student's enrolled live sessions + center
    if (!student.enrolledLiveSessionsCenter) {
      student.enrolledLiveSessionsCenter = [];
    }
    student.enrolledLiveSessionsCenter.push(courseId);

    // Also add to regular live sessions if not already enrolled
    if (!student.enrolledLiveSessions.includes(courseId)) {
      student.enrolledLiveSessions.push(courseId);
    }

    await syncCourseAccessOnEnrollment(student, courseId, new Date());
    await student.save();

    console.log("Live session + center enrollment successful:", {
      studentId: student._id,
      courseId: courseId,
    });

    res.json({
      message: "Student enrolled in live session + center successfully",
      studentId: student._id,
      courseId: courseId,
      enrolledLiveSessionsCenter: student.enrolledLiveSessionsCenter,
    });
  } catch (err) {
    console.error("Live session + center enrollment error:", err);
    res.status(500).json({
      message: "Failed to enroll student in live session + center",
      error: err.message,
    });
  }
});

// DELETE /api/v1/students/:id - Delete a student
router.delete("/:id", deleteStudent);

// PUT /api/v1/students/:id/status - Update student status
router.put("/:id/status", updateStudentStatus);

export default router;
