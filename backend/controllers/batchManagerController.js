import BatchManager from "../models/BatchManager.js";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";
import Chapter from "../models/Content/Chapter.js";
import Topic from "../models/Content/Topic.js";
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

  const transporter = createTransporter();
  await transporter.verify();

  const results = await Promise.allSettled(
    students.map(async (student) => {
      await transporter.sendMail({
        from: `"IICPA Institute" <${emailConfig.auth.user}>`,
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

    if (startTime && (!(normalizedStart instanceof Date) || Number.isNaN(normalizedStart.getTime()))) {
      throw createValidationError(`Invalid start_time for course ${courseId}`);
    }

    if (endTime && (!(normalizedEnd instanceof Date) || Number.isNaN(normalizedEnd.getTime()))) {
      throw createValidationError(`Invalid end_time for course ${courseId}`);
    }

    if (normalizedStart && normalizedEnd && normalizedEnd.getTime() < normalizedStart.getTime()) {
      throw createValidationError(`end_time must be after start_time for course ${courseId}`);
    }

    const chapters = [];
    for (const chapter of parseMaybeArray(item?.chapters)) {
      const chapterId = String(chapter?.chapterId || "").trim();
      if (!chapterId) continue;

      const chapStart = chapter?.start_time ?? chapter?.startTime ?? chapter?.start;
      const chapEnd = chapter?.end_time ?? chapter?.endTime ?? chapter?.end;
      const normChapStart = chapStart ? new Date(chapStart) : null;
      const normChapEnd = chapEnd ? new Date(chapEnd) : null;

      const topics = [];
      for (const topic of parseMaybeArray(chapter?.topics)) {
        const topicId = String(topic?.topicId || "").trim();
        if (!topicId) continue;

        const topicStart = topic?.start_time ?? topic?.startTime ?? topic?.start;
        const topicEnd = topic?.end_time ?? topic?.endTime ?? topic?.end;
        const normTopicStart = topicStart ? new Date(topicStart) : null;
        const normTopicEnd = topicEnd ? new Date(topicEnd) : null;

        topics.push({
          topicId,
          start_time: normTopicStart,
          end_time: normTopicEnd,
        });
      }

      chapters.push({
        chapterId,
        start_time: normChapStart,
        end_time: normChapEnd,
        topics,
      });
    }

    seen.add(courseId);
    normalized.push({
      courseId,
      start_time: normalizedStart,
      end_time: normalizedEnd,
      chapters,
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

export const sendStudentScheduleEmail = async (req, res) => {
  try {
    const { id: batchId, studentId } = req.params;

    if (!batchId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "batchId and studentId are required",
      });
    }

    const batch = await BatchManager.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const student = await Student.findOne({ _id: studentId, batchId: batch._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this batch",
      });
    }

    if (!student.email) {
      return res.status(400).json({
        success: false,
        message: "Student does not have a configured email address",
      });
    }

    if (!isEmailConfigured()) {
      setupEmailInstructions();
      return res.status(500).json({
        success: false,
        message: "Email service is not configured on the server",
      });
    }

    // Extract all course, chapter, topic IDs to fetch them efficiently
    const courseIds = [];
    const chapterIds = [];
    const topicIds = [];

    (batch.courseLocks || []).forEach((lock) => {
      if (lock.courseId) courseIds.push(lock.courseId);
      (lock.chapters || []).forEach((ch) => {
        if (ch.chapterId) chapterIds.push(ch.chapterId);
        (ch.topics || []).forEach((t) => {
          if (t.topicId) topicIds.push(t.topicId);
        });
      });
    });

    const [courses, chapters, topics] = await Promise.all([
      Course.find({ _id: { $in: courseIds } }).select("title name slug").lean(),
      Chapter.find({ _id: { $in: chapterIds } }).select("title").lean(),
      Topic.find({ _id: { $in: topicIds } }).select("title").lean(),
    ]);

    const courseMap = new Map(courses.map((c) => [String(c._id), c]));
    const chapterMap = new Map(chapters.map((c) => [String(c._id), c]));
    const topicMap = new Map(topics.map((t) => [String(t._id), t]));

    const courseSchedules = (batch.courseLocks || []).map((lock) => {
      const courseIdStr = String(lock.courseId);
      const courseDoc = courseMap.get(courseIdStr);
      
      const chaptersList = (lock.chapters || []).map((ch) => {
        const chapterIdStr = String(ch.chapterId);
        const chapterDoc = chapterMap.get(chapterIdStr);
        
        const topicsList = (ch.topics || []).map((t) => {
          const topicIdStr = String(t.topicId);
          const topicDoc = topicMap.get(topicIdStr);
          return {
            topicId: topicIdStr,
            title: topicDoc?.title || "Untitled Topic",
            startTime: formatDateTime(t.start_time || lock.start_time),
            endTime: formatDateTime(t.end_time || lock.end_time),
          };
        });

        return {
          chapterId: chapterIdStr,
          title: chapterDoc?.title || "Untitled Chapter",
          startTime: formatDateTime(ch.start_time || lock.start_time),
          endTime: formatDateTime(ch.end_time || lock.end_time),
          topics: topicsList,
        };
      });

      return {
        courseId: courseIdStr,
        title: getCourseTitle(courseDoc),
        startTime: formatDateTime(lock.start_time),
        endTime: formatDateTime(lock.end_time),
        chapters: chaptersList,
      };
    });

    const scheduleHtml = courseSchedules
      .map((course) => {
        const chaptersHtml = (course.chapters || []).map((ch) => {
          const topicsHtml = (ch.topics || []).map((t) => `
            <div style="margin-left: 24px; margin-top: 8px; padding: 8px 12px; background-color: #f1f5f9; border-radius: 6px; border-left: 2px solid #64748b;">
              <div style="font-size: 13px; font-weight: 600; color: #334155;">📌 ${escapeHtml(t.title)}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                <span>📅 Start: ${escapeHtml(t.startTime)}</span> | <span>🔒 End: ${escapeHtml(t.endTime)}</span>
              </div>
            </div>
          `).join("");

          return `
            <div style="margin-top: 12px; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
              <div style="font-size: 14px; font-weight: 700; color: #1e293b;">📖 Chapter: ${escapeHtml(ch.title)}</div>
              <div style="font-size: 12px; color: #475569; margin-top: 4px;">
                <span>📅 Start: ${escapeHtml(ch.startTime)}</span> | <span>🔒 End: ${escapeHtml(ch.endTime)}</span>
              </div>
              ${topicsHtml}
            </div>
          `;
        }).join("");

        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="font-size: 12px; font-weight: 700; color: #3cd664; text-transform: uppercase; letter-spacing: 0.5px;">Course</span>
              <h3 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #0f172a;">${escapeHtml(course.title)}</h3>
              <div style="font-size: 13px; color: #475569; margin-top: 6px;">
                <span>📅 Start: ${escapeHtml(course.startTime)}</span> | <span>🔒 End: ${escapeHtml(course.endTime)}</span>
              </div>
            </div>
            ${chaptersHtml || '<div style="font-size: 13px; color: #94a3b8; font-style: italic;">No specific chapter or topic schedule configured.</div>'}
          </div>
        `;
      }).join("");

    const emailContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background-color: #f8fafc; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">IICPA Institute</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; color: #3cd664; font-weight: 600;">Your Detailed Class Schedule</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">Dear <strong>${escapeHtml(student.name)}</strong>,</p>
          <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
            Your class schedule for the batch <strong>${escapeHtml(batch.code || "IICPA Batch")}</strong> has been set. Below is the detailed sequence of your courses, chapters, and topics.
          </p>

          <!-- Schedule Tree Container -->
          <div style="margin-bottom: 32px;">
            ${scheduleHtml}
          </div>

          <!-- Footer Note -->
          <div style="background-color: #ecfeff; border-left: 4px solid #06b6d4; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #083344;">
              <strong>Note:</strong> You can access your classes through the student dashboard. If any nested item does not show a custom schedule, it falls back to the parent schedule.
            </p>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

          <!-- Social Media Links -->
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Connect With Us</p>
            <div style="display: inline-block;">
              <!-- Facebook -->
              <a href="https://www.facebook.com/profile.php?id=61581482543779" target="_blank" style="text-decoration: none; margin: 0 8px; display: inline-block; vertical-align: middle;">
                <img src="https://img.icons8.com/color/48/facebook-new.png" width="36" height="36" alt="Facebook" style="display: block; border: 0;" />
              </a>
              <!-- Instagram -->
              <a href="https://www.instagram.com/iicpainstitute/" target="_blank" style="text-decoration: none; margin: 0 8px; display: inline-block; vertical-align: middle;">
                <img src="https://img.icons8.com/color/48/instagram-new.png" width="36" height="36" alt="Instagram" style="display: block; border: 0;" />
              </a>
              <!-- YouTube -->
              <a href="https://www.youtube.com/@IICPAInstitutes" target="_blank" style="text-decoration: none; margin: 0 8px; display: inline-block; vertical-align: middle;">
                <img src="https://img.icons8.com/color/48/youtube-play.png" width="36" height="36" alt="YouTube" style="display: block; border: 0;" />
              </a>
              <!-- LinkedIn -->
              <a href="https://www.linkedin.com/in/iicpa-institute-24aa9b386/" target="_blank" style="text-decoration: none; margin: 0 8px; display: inline-block; vertical-align: middle;">
                <img src="https://img.icons8.com/color/48/linkedin.png" width="36" height="36" alt="LinkedIn" style="display: block; border: 0;" />
              </a>
            </div>
          </div>

          <!-- Footer Copyright -->
          <div style="text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} IICPA Institute. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    const transporter = createTransporter();
    await transporter.verify();

    await transporter.sendMail({
      from: `"IICPA Institute" <${emailConfig.auth.user}>`,
      to: student.email,
      subject: `Your Detailed Class Schedule: ${batch.code || "IICPA Batch"}`,
      html: emailContent,
    });

    return res.status(200).json({
      success: true,
      message: "Schedule email sent successfully to " + student.email,
    });
  } catch (error) {
    console.error("Error sending student schedule email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send schedule email",
      error: error.message,
    });
  }
};
