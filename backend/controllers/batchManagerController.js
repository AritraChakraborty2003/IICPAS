import BatchManager from "../models/BatchManager.js";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";
import nodemailer from "nodemailer";
import {
  emailConfig,
  isEmailConfigured,
  setupEmailInstructions,
} from "../config/emailConfig.js";
import {
  buildBatchSummary,
  generateNextBatchCode,
  normalizeBatchMode,
  normalizeBatchSize,
} from "../services/batchAssignmentService.js";

const createTransporter = () => nodemailer.createTransport(emailConfig);

const parseMaybeArray = (value) => {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to scalar handling
    }

    return [trimmed];
  }

  return [value];
};

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const getCourseTitle = (course) =>
  course?.title || course?.name || course?.slug || "Untitled Course";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const serializeCourseLocks = (courseLocks = []) =>
  JSON.stringify(
    (Array.isArray(courseLocks) ? courseLocks : []).map((lock) => ({
      courseId: String(lock?.courseId || "").trim(),
      start_time: (() => {
        const date = new Date(lock?.start_time || lock?.startTime || lock?.start || null);
        return Number.isNaN(date.getTime()) ? "" : date.toISOString();
      })(),
      end_time: (() => {
        const date = new Date(lock?.end_time || lock?.endTime || lock?.end || null);
        return Number.isNaN(date.getTime()) ? "" : date.toISOString();
      })(),
    }))
  );

const buildBatchCourseScheduleEmail = ({ studentName, batch, courseSchedules }) => {
  const scheduleHtml = courseSchedules
    .map(
      (course) => `
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 12px 0;">
          <p style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#111827;">${escapeHtml(course.title)}</p>
          <p style="margin:0 0 4px 0;font-size:14px;color:#4b5563;">Course ID: ${escapeHtml(course.courseId)}</p>
          <p style="margin:0 0 4px 0;font-size:14px;color:#4b5563;">Start Time: ${escapeHtml(course.startTime)}</p>
          <p style="margin:0;font-size:14px;color:#4b5563;">End Time: ${escapeHtml(course.endTime)}</p>
        </div>
      `
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;color:#1f2937;">
      <div style="background:#0f172a;color:#ffffff;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">IICPA Institute</h1>
        <p style="margin:6px 0 0 0;font-size:16px;">Batch Course Schedule Update</p>
      </div>
      <div style="padding:20px;background:#f8fafc;">
        <p style="margin:0 0 12px 0;">Dear ${escapeHtml(studentName || "Student")},</p>
        <p style="margin:0 0 12px 0;">
          Your batch schedule has been updated. Please review the course timings below.
        </p>
        <div style="background:#ecfeff;border-left:4px solid #14b8a6;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0 0 4px 0;font-size:14px;color:#0f766e;">Batch</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(batch?.code || "IICPA Batch")}</p>
        </div>
        ${scheduleHtml}
        <p style="margin:16px 0 0 0;">
          Please log in to your student dashboard if you need to check your batch details.
        </p>
        <p style="margin:16px 0 0 0;">
          Regards,<br />
          Team IICPA
        </p>
      </div>
    </div>
  `;
};

const sendBatchCourseScheduleEmails = async (batch) => {
  if (!batch?.courseLocks?.length) {
    return { sent: 0, skipped: true };
  }

  if (!isEmailConfigured()) {
    setupEmailInstructions();
    return { sent: 0, skipped: true };
  }

  const students = await Student.find({
    batchId: batch._id,
    email: { $exists: true, $ne: "" },
  })
    .select("name email")
    .lean();

  if (!students.length) {
    return { sent: 0, skipped: true };
  }

  const courseIds = batch.courseLocks
    .map((lock) => String(lock?.courseId || "").trim())
    .filter(Boolean);
  const courses = await Course.find({ _id: { $in: courseIds } })
    .select("title name slug")
    .lean();
  const courseById = new Map(courses.map((course) => [String(course._id), course]));

  const courseSchedules = batch.courseLocks.map((lock) => {
    const courseId = String(lock?.courseId || "").trim();
    const course = courseById.get(courseId);

    return {
      courseId,
      title: getCourseTitle(course),
      startTime: formatDateTime(lock?.start_time),
      endTime: formatDateTime(lock?.end_time),
    };
  });

  const results = await Promise.allSettled(
    students.map(async (student) => {
      const transporter = createTransporter();
      await transporter.verify();
      await transporter.sendMail({
        from: `"IICPA Institute" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `Batch Schedule Updated: ${batch.code || "IICPA Batch"}`,
        html: buildBatchCourseScheduleEmail({
          studentName: student.name,
          batch,
          courseSchedules,
        }),
      });
    })
  );

  const sent = results.filter((result) => result.status === "fulfilled").length;
  const failed = results.length - sent;
  if (failed > 0) {
    console.warn(`Failed to send ${failed} batch schedule email(s) for batch ${batch.code || batch._id}`);
  }

  return { sent, failed, skipped: false };
};

const courseLocksChanged = (left = [], right = []) =>
  serializeCourseLocks(left) !== serializeCourseLocks(right);

const normalizeBatchCourseLocks = (value) => {
  const seen = new Set();
  const normalized = [];

  for (const item of parseMaybeArray(value)) {
    const rawCourseId = item?.courseId ?? item?.course_id ?? item?.course ?? item?._id;
    const courseId = String(rawCourseId || "").trim();
    if (!courseId || seen.has(courseId)) continue;

    const startTime = item?.start_time ?? item?.startTime ?? item?.start;
    const endTime = item?.end_time ?? item?.endTime ?? item?.end;
    const normalizedStart = startTime ? new Date(startTime) : null;
    const normalizedEnd = endTime ? new Date(endTime) : null;

    if (!(normalizedStart instanceof Date) || Number.isNaN(normalizedStart.getTime())) {
      throw createValidationError(`Invalid start_time for course ${courseId}`);
    }

    if (!(normalizedEnd instanceof Date) || Number.isNaN(normalizedEnd.getTime())) {
      throw createValidationError(`Invalid end_time for course ${courseId}`);
    }

    if (normalizedEnd.getTime() < normalizedStart.getTime()) {
      throw createValidationError(`end_time must be after start_time for course ${courseId}`);
    }

    seen.add(courseId);
    normalized.push({
      courseId,
      start_time: normalizedStart,
      end_time: normalizedEnd,
    });
  }

  return normalized;
};

const reconcileBatchMetadata = async () => {
  const studentCounts = await Student.aggregate([
    {
      $match: {
        batchId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$batchId",
        count: { $sum: 1 },
      },
    },
  ]);

  const countByBatchId = new Map(
    studentCounts.map((entry) => [String(entry?._id), Number(entry?.count || 0)])
  );

  const batches = await BatchManager.find({}).sort({ createdAt: 1 });

  for (const batch of batches) {
    if (!batch.code) {
      batch.code = await generateNextBatchCode();
    }

    const actualCount = countByBatchId.get(String(batch._id)) || 0;
    batch.assignedCount = actualCount;
    await batch.save();
  }
};

export const getBatchManagerEntries = async (req, res) => {
  try {
    await reconcileBatchMetadata();
    const batches = await BatchManager.getBatches();

    return res.status(200).json({
      success: true,
      batches: batches.map((batch) => buildBatchSummary(batch)),
    });
  } catch (error) {
    console.error("Error fetching batch entries:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch batch entries",
      error: error.message,
    });
  }
};

export const createBatchManagerEntry = async (req, res) => {
  try {
    const mode = normalizeBatchMode(req.body.mode);
    const size = normalizeBatchSize(req.body.size);
    const courseLocks = normalizeBatchCourseLocks(
      req.body.courseLocks ?? req.body.courseLockSchedule ?? req.body.courseSchedule
    );

    if (!mode || !size) {
      return res.status(400).json({
        success: false,
        message: "Mode and size are required",
      });
    }

    const batch = await BatchManager.create({
      code: await generateNextBatchCode(),
      mode,
      size,
      courseLocks,
      assignedCount: 0,
    });

    if (courseLocks.length > 0) {
      try {
        await sendBatchCourseScheduleEmails(batch);
      } catch (emailError) {
        console.error("Failed to send batch course schedule emails after creation:", emailError);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch: buildBatchSummary(batch),
    });
  } catch (error) {
    console.error("Error creating batch:", error);
    if (error?.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create batch",
      error: error.message,
    });
  }
};

export const updateBatchManagerEntry = async (req, res) => {
  try {
    const mode = normalizeBatchMode(req.body.mode);
    const size = normalizeBatchSize(req.body.size);
    const hasCourseLocks =
      Object.prototype.hasOwnProperty.call(req.body, "courseLocks") ||
      Object.prototype.hasOwnProperty.call(req.body, "courseLockSchedule") ||
      Object.prototype.hasOwnProperty.call(req.body, "courseSchedule");
    const courseLocks = hasCourseLocks
      ? normalizeBatchCourseLocks(
          req.body.courseLocks ?? req.body.courseLockSchedule ?? req.body.courseSchedule
        )
      : null;

    if (!mode || !size) {
      return res.status(400).json({
        success: false,
        message: "Mode and size are required",
      });
    }

    const batch = await BatchManager.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const assignedCount = Number(batch.assignedCount || 0);
    if (size < assignedCount) {
      return res.status(400).json({
        success: false,
        message: "Size cannot be smaller than the current assigned count",
      });
    }

    batch.mode = mode;
    batch.size = size;
    if (hasCourseLocks) {
      batch.courseLocks = courseLocks;
    }
    if (!batch.code) {
      batch.code = await generateNextBatchCode();
    }
    await batch.save();

    if (hasCourseLocks && courseLocks?.length > 0) {
      try {
        await sendBatchCourseScheduleEmails(batch);
      } catch (emailError) {
        console.error("Failed to send batch course schedule emails after update:", emailError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      batch: buildBatchSummary(batch),
    });
  } catch (error) {
    console.error("Error updating batch:", error);
    if (error?.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update batch",
      error: error.message,
    });
  }
};

export const deleteBatchManagerEntry = async (req, res) => {
  try {
    const batch = await BatchManager.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const actualAssignedCount = await Student.countDocuments({
      batchId: batch._id,
    });

    if (actualAssignedCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a batch that already has assigned students",
      });
    }

    await batch.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete batch",
      error: error.message,
    });
  }
};
