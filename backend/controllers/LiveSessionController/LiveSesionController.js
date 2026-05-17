import mongoose from "mongoose";
import LiveSession from "../../models/LiveSession/LiveSession.js";
import Student from "../../models/Students.js";
import Booking from "../../models/Booking.js";
import Course from "../../models/Content/Course.js";
import Chapter from "../../models/Content/Chapter.js";
import BatchManager from "../../models/BatchManager.js";
import {
  computeReminderSendAt,
  DEFAULT_REMINDER_BATCH_DELAY_SECONDS,
  DEFAULT_REMINDER_BATCH_SIZE,
  DEFAULT_REMINDER_LEAD_TIME_MINUTES,
  DEFAULT_REMINDER_TIME_ZONE,
  REMINDER_JOB_STATUS,
  toIntegerInRange,
} from "../../utils/liveSessionReminderHelpers.js";

const buildReminderSettingsPayload = ({
  currentReminderSettings = {},
  sessionDate,
  sessionTime,
  incomingReminderSettings = null,
}) => {
  const existingReminderObject =
    currentReminderSettings?.toObject?.() || currentReminderSettings || {};

  const timezone = String(
    incomingReminderSettings?.timezone ||
      existingReminderObject.timezone ||
      DEFAULT_REMINDER_TIME_ZONE
  ).trim() || DEFAULT_REMINDER_TIME_ZONE;

  const leadTimeMinutes = toIntegerInRange(
    incomingReminderSettings?.leadTimeMinutes ??
      existingReminderObject.leadTimeMinutes,
    DEFAULT_REMINDER_LEAD_TIME_MINUTES,
    { min: 1 }
  );

  const batchSize = toIntegerInRange(
    incomingReminderSettings?.batchSize ?? existingReminderObject.batchSize,
    DEFAULT_REMINDER_BATCH_SIZE,
    { min: 1 }
  );

  const batchDelaySeconds = toIntegerInRange(
    incomingReminderSettings?.batchDelaySeconds ??
      existingReminderObject.batchDelaySeconds,
    DEFAULT_REMINDER_BATCH_DELAY_SECONDS,
    { min: 0 }
  );

  const sendAt = computeReminderSendAt({
    date: sessionDate,
    time: sessionTime,
    leadTimeMinutes,
    timeZone: timezone,
  });

  return {
    leadTimeMinutes,
    batchSize,
    batchDelaySeconds,
    timezone,
    sendAt,
    status: REMINDER_JOB_STATUS.QUEUED,
    sentAt: null,
    lastError: "",
    recipientCount: 0,
  };
};

const normalizeOptionalId = (value) => {
  if (value === null || value === undefined) return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
};

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
      // fall through to comma-separated / scalar handling
    }

    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [trimmed];
  }

  return [value];
};

const normalizeIdArray = (value) =>
  Array.from(
    new Set(
      parseMaybeArray(value)
        .map((item) => {
          if (item === null || item === undefined) return "";
          if (typeof item === "object" && item._id) {
            return String(item._id).trim();
          }
          return String(item).trim();
        })
        .filter(Boolean)
    )
  );

const normalizeLiveSessionResponse = (session) => {
  const sessionObj = session?.toObject?.() || session || {};
  const courseIds = Array.isArray(sessionObj.courseIds) && sessionObj.courseIds.length
    ? sessionObj.courseIds
    : sessionObj.courseId
      ? [sessionObj.courseId]
      : [];
  const chapterIds = Array.isArray(sessionObj.chapterIds) && sessionObj.chapterIds.length
    ? sessionObj.chapterIds
    : sessionObj.chapterId
      ? [sessionObj.chapterId]
      : [];

  return {
    ...sessionObj,
    courseIds,
    chapterIds,
  };
};

const populateLiveSession = (query) =>
  query
    .populate("courseIds", "title slug category")
    .populate("chapterIds", "title order")
    .populate("courseId", "title slug category")
    .populate("chapterId", "title order")
    .populate("batchId", "code mode size assignedCount")
    .populate("enrolledStudents", "name email");

const buildAuthorProfile = (profile = {}, fallback = {}) => ({
  image: profile.image || profile.authorImage || fallback.image || "",
  name: profile.name || profile.authorName || fallback.name || "",
  code: profile.code || profile.authorCode || fallback.code || "IICPA",
  text: profile.text || profile.authorText || fallback.text || "",
});

const normalizeAuthorProfiles = (landingPage = {}, fallback = {}) => {
  const baseFallback = {
    image: fallback.imageUrl || fallback.thumbnail || fallback.image || "",
    name: fallback.instructor || "",
    code: "IICPA",
    text: fallback.description || "",
  };

  const profiles = Array.isArray(landingPage.authorProfiles)
    ? landingPage.authorProfiles.map((profile) =>
        buildAuthorProfile(profile, baseFallback)
      )
    : [];

  if (profiles.length === 0 && Array.isArray(fallback.authorProfiles)) {
    profiles.push(
      ...fallback.authorProfiles.map((profile) =>
        buildAuthorProfile(profile, baseFallback)
      )
    );
  }

  if (profiles.length === 0) {
    profiles.push(buildAuthorProfile({}, baseFallback));
  }

  return profiles;
};

const normalizeLandingPagePayload = (landingPage = {}, fallback = {}) => {
  const authorProfiles = normalizeAuthorProfiles(landingPage, fallback);
  const primaryProfile = authorProfiles[0] || buildAuthorProfile();

  return {
    ...landingPage,
    authorLayout:
      landingPage.authorLayout === "two-per-line"
        ? "two-per-line"
        : fallback.authorLayout === "two-per-line"
          ? "two-per-line"
          : "stack",
    mobileHeroImage: landingPage.mobileHeroImage || fallback.mobileHeroImage || "",
    authorProfiles,
    authorImage: primaryProfile.image || "",
    authorName: primaryProfile.name || "",
    authorCode: primaryProfile.code || "IICPA",
    authorText: primaryProfile.text || "",
  };
};

const validateCourseChapterSelection = async ({ courseIds = [], chapterIds = [] }) => {
  const normalizedCourseIds = normalizeIdArray(courseIds);
  const normalizedChapterIds = normalizeIdArray(chapterIds);

  if (!normalizedCourseIds.length && normalizedChapterIds.length) {
    return {
      error: "Select at least one course before choosing chapters",
    };
  }

  for (const courseId of normalizedCourseIds) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return { error: "Invalid courseId" };
    }
  }

  for (const chapterId of normalizedChapterIds) {
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return { error: "Invalid chapterId" };
    }
  }

  const courseDocs = normalizedCourseIds.length
    ? await Course.find({ _id: { $in: normalizedCourseIds } }).select("chapters title")
    : [];

  if (courseDocs.length !== normalizedCourseIds.length) {
    return { error: "Selected course not found" };
  }

  if (normalizedChapterIds.length) {
    const allowedChapterIds = new Set(
      courseDocs.flatMap((courseDoc) =>
        Array.isArray(courseDoc.chapters)
          ? courseDoc.chapters.map((chapter) => String(chapter))
          : []
      )
    );

    const chapterDocs = await Chapter.find({
      _id: { $in: normalizedChapterIds },
    }).select("title");

    if (chapterDocs.length !== normalizedChapterIds.length) {
      return { error: "Selected chapter not found" };
    }

    const invalidChapter = normalizedChapterIds.find(
      (chapterId) => !allowedChapterIds.has(String(chapterId))
    );

    if (invalidChapter) {
      return {
        error: "Selected chapter does not belong to the selected course(s)",
      };
    }
  }

  return {
    courseIds: normalizedCourseIds,
    chapterIds: normalizedChapterIds,
  };
};

const validateBatchSelection = async (batchId) => {
  if (batchId === null || batchId === undefined || batchId === "") {
    return { batchId: null, batchCode: null };
  }

  const normalizedBatchId = String(batchId).trim();
  if (!mongoose.Types.ObjectId.isValid(normalizedBatchId)) {
    return { error: "Invalid batchId" };
  }

  const batch = await BatchManager.findById(normalizedBatchId).select("code");
  if (!batch) {
    return { error: "Selected batch not found" };
  }

  return {
    batchId: batch._id,
    batchCode: batch.code || null,
  };
};

export const createLiveSession = async (req, res) => {
  try {
    const selection = await validateCourseChapterSelection({
      courseIds: Object.prototype.hasOwnProperty.call(req.body, "courseIds")
        ? req.body.courseIds
        : req.body.courseId,
      chapterIds: Object.prototype.hasOwnProperty.call(req.body, "chapterIds")
        ? req.body.chapterIds
        : req.body.chapterId,
    });

    if (selection.error) {
      return res.status(400).json({ error: selection.error });
    }

    const primaryCourseId = selection.courseIds[0] || null;
    const primaryChapterId = selection.chapterIds[0] || null;

    // Ensure imageUrl is set to thumbnail if not provided
    const sessionData = {
      ...req.body,
      courseIds: selection.courseIds,
      chapterIds: selection.chapterIds,
      courseId: primaryCourseId,
      chapterId: primaryChapterId,
      batchId: null,
      batchCode: null,
      imageUrl: req.body.imageUrl || req.body.thumbnail,
      landingPage: normalizeLandingPagePayload(req.body.landingPage, req.body),
    };

    if (Object.prototype.hasOwnProperty.call(req.body, "batchId")) {
      const batchSelection = await validateBatchSelection(req.body.batchId);
      if (batchSelection.error) {
        return res.status(400).json({ error: batchSelection.error });
      }

      sessionData.batchId = batchSelection.batchId;
      sessionData.batchCode = batchSelection.batchCode;
    }

    if (!sessionData.courseId) delete sessionData.courseId;
    if (!sessionData.chapterId) delete sessionData.chapterId;

    const session = await LiveSession.create(sessionData);
    await session.populate([
      { path: "courseIds", select: "title slug category" },
      { path: "chapterIds", select: "title order" },
      { path: "courseId", select: "title slug category" },
      { path: "chapterId", select: "title order" },
      { path: "batchId", select: "code mode size assignedCount" },
      { path: "enrolledStudents", select: "name email" },
    ]);
    res.status(201).json(normalizeLiveSessionResponse(session));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllLiveSessions = async (req, res) => {
  try {
    const sessions = await populateLiveSession(LiveSession.find());
    const sessionIds = sessions.map((session) => session._id);
    const paidBookings = await Booking.aggregate([
      {
        $match: {
          liveSessionId: { $in: sessionIds },
          paymentStatus: { $in: ["paid", "free"] },
          status: { $in: ["booked", "approved"] },
        },
      },
      {
        $group: {
          _id: "$liveSessionId",
          total: { $sum: 1 },
        },
      },
    ]);
    const bookingCountMap = new Map(
      paidBookings.map((entry) => [String(entry._id), Number(entry.total || 0)])
    );

    const transformedSessions = sessions.map((session) => {
      const sessionObj = normalizeLiveSessionResponse(session);
      const now = new Date();
      const sessionDate = new Date(session.date);
      const [startTime, endTime] = session.time
        ? session.time.split(" - ")
        : ["10:00", "12:00"];

      const sessionStart = new Date(sessionDate);
      const [startHour, startMinute] = startTime.split(":").map(Number);
      sessionStart.setHours(startHour, startMinute, 0, 0);

      const sessionEnd = new Date(sessionDate);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      sessionEnd.setHours(endHour, endMinute, 0, 0);

      const durationMs = sessionEnd.getTime() - sessionStart.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      let dynamicStatus = session.status;

      if (session.status === "active") {
        if (now < sessionStart) {
          dynamicStatus = "upcoming";
        } else if (now >= sessionStart && now <= sessionEnd) {
          dynamicStatus = "live";
        } else if (now > sessionEnd) {
          dynamicStatus = "completed";
        }
      }

      let finalImageUrl = session.imageUrl || session.thumbnail;
      if (!finalImageUrl) {
        finalImageUrl = "/images/live-class.jpg";
      }

      return {
        ...sessionObj,
        status: dynamicStatus,
        duration: durationMinutes,
        enrolledCount: Math.max(
          session.enrolledStudents.length,
          bookingCountMap.get(String(session._id)) || 0
        ),
        imageUrl: finalImageUrl,
      };
    });

    res.status(200).json(transformedSessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/live-sessions/for-student/:studentId
// Returns only live sessions linked to courses the student has purchased.
export const getLiveSessionsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const student = await Student.findById(studentId)
      .select("course courseAccessOverrides")
      .lean();

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Collect purchased course IDs from the student's course array
    const purchasedCourseIdSet = new Set(
      (Array.isArray(student.course) ? student.course : []).map((id) => String(id))
    );

    // Also include courses from courseAccessOverrides that are not locked
    if (Array.isArray(student.courseAccessOverrides)) {
      student.courseAccessOverrides.forEach((entry) => {
        if (!entry.isLocked && entry.courseId) {
          purchasedCourseIdSet.add(String(entry.courseId));
        }
      });
    }

    if (purchasedCourseIdSet.size === 0) {
      return res.status(200).json([]);
    }

    const purchasedCourseIds = Array.from(purchasedCourseIdSet);

    // Find sessions that include at least one of the student's purchased courses
    const sessions = await populateLiveSession(
      LiveSession.find({
        $or: [
          { courseIds: { $in: purchasedCourseIds } },
          { courseId: { $in: purchasedCourseIds } },
        ],
      })
    );

    const transformedSessions = sessions.map((session) => {
      const sessionObj = normalizeLiveSessionResponse(session);
      const now = new Date();
      const sessionDate = new Date(session.date);
      const [startTime, endTime] = session.time
        ? session.time.split(" - ")
        : ["10:00", "12:00"];

      const sessionStart = new Date(sessionDate);
      const [startHour, startMinute] = startTime.split(":").map(Number);
      sessionStart.setHours(startHour, startMinute, 0, 0);

      const sessionEnd = new Date(sessionDate);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      sessionEnd.setHours(endHour, endMinute, 0, 0);

      const durationMs = sessionEnd.getTime() - sessionStart.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      let dynamicStatus = session.status;
      if (session.status === "active") {
        if (now < sessionStart) dynamicStatus = "upcoming";
        else if (now >= sessionStart && now <= sessionEnd) dynamicStatus = "live";
        else if (now > sessionEnd) dynamicStatus = "completed";
      }

      let finalImageUrl = session.imageUrl || session.thumbnail;
      if (!finalImageUrl) finalImageUrl = "/images/live-class.jpg";

      return {
        ...sessionObj,
        status: dynamicStatus,
        duration: durationMinutes,
        enrolledCount: session.enrolledStudents?.length || 0,
        imageUrl: finalImageUrl,
      };
    });

    res.status(200).json(transformedSessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getLiveSessionById = async (req, res) => {
  try {
    const session = await populateLiveSession(
      LiveSession.findById(req.params.id)
    );
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Calculate dynamic status
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startTime, endTime] = session.time
      ? session.time.split(" - ")
      : ["10:00", "12:00"];

    const sessionStart = new Date(sessionDate);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    sessionStart.setHours(startHour, startMinute, 0, 0);

    const sessionEnd = new Date(sessionDate);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    sessionEnd.setHours(endHour, endMinute, 0, 0);

    // Calculate duration in minutes
    const durationMs = sessionEnd.getTime() - sessionStart.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    let dynamicStatus = session.status;

    // Only calculate dynamic status if session is active in database
    if (session.status === "active") {
      if (now < sessionStart) {
        dynamicStatus = "upcoming";
      } else if (now >= sessionStart && now <= sessionEnd) {
        dynamicStatus = "live";
      } else if (now > sessionEnd) {
        dynamicStatus = "completed";
      }
    }
    // If session is inactive in database, keep it as inactive

    const sessionObj = normalizeLiveSessionResponse(session);
    const paidBookingCount = await Booking.countDocuments({
      liveSessionId: session._id,
      paymentStatus: { $in: ["paid", "free"] },
      status: { $in: ["booked", "approved"] },
    });
    // Handle image URLs - prioritize uploaded images, then fallback to client images
    let finalImageUrl = session.imageUrl || session.thumbnail;

    // If it's an uploaded image (starts with /uploads), use it as is
    // If it's a client image (starts with /images), use it as is
    // If it's empty, use a default fallback
    if (!finalImageUrl) {
      finalImageUrl = "/images/live-class.jpg"; // Default fallback
    }

    res.status(200).json({
      ...sessionObj,
      status: dynamicStatus,
      duration: durationMinutes, // Use calculated duration
      enrolledCount: Math.max(session.enrolledStudents.length, paidBookingCount),
      imageUrl: finalImageUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const enrollInLiveSession = async (req, res) => {
  try {
    const { studentId } = req.body;
    const sessionId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Check if session exists
    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if already enrolled
    if (session.enrolledStudents.includes(studentId)) {
      return res
        .status(400)
        .json({ error: "Student already enrolled in this session" });
    }

    // Check if session is full
    if (session.enrolledStudents.length >= session.maxParticipants) {
      return res.status(400).json({ error: "Session is full" });
    }

    // Enroll student
    session.enrolledStudents.push(studentId);
    session.enrolledCount = session.enrolledStudents.length;
    await session.save();

    // Add session to student's enrolled sessions
    if (!student.enrolledLiveSessions.includes(sessionId)) {
      student.enrolledLiveSessions.push(sessionId);
      await student.save();
    }

    // Emit real-time update to all clients in the session room
    if (global.io) {
      global.io.to(`session-${sessionId}`).emit("enrollment-update", {
        sessionId: session._id,
        enrolledCount: session.enrolledCount,
        maxParticipants: session.maxParticipants,
        studentName: student.name,
      });
    }

    res.status(200).json({
      message: "Successfully enrolled in live session",
      session: {
        _id: session._id,
        title: session.title,
        enrolledCount: session.enrolledCount,
        maxParticipants: session.maxParticipants,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unenrollFromLiveSession = async (req, res) => {
  try {
    const { studentId } = req.body;
    const sessionId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Check if session exists
    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if enrolled
    if (!session.enrolledStudents.includes(studentId)) {
      return res
        .status(400)
        .json({ error: "Student is not enrolled in this session" });
    }

    // Unenroll student
    session.enrolledStudents = session.enrolledStudents.filter(
      (id) => id.toString() !== studentId
    );
    session.enrolledCount = session.enrolledStudents.length;
    await session.save();

    // Remove session from student's enrolled sessions
    student.enrolledLiveSessions = student.enrolledLiveSessions.filter(
      (id) => id.toString() !== sessionId
    );
    await student.save();

    res.status(200).json({
      message: "Successfully unenrolled from live session",
      session: {
        _id: session._id,
        title: session.title,
        enrolledCount: session.enrolledCount,
        maxParticipants: session.maxParticipants,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLiveSession = async (req, res) => {
  try {
    const currentSession = await LiveSession.findById(req.params.id);
    if (!currentSession) return res.status(404).json({ error: "Session not found" });

    const currentSelectionFallback = normalizeLiveSessionResponse(currentSession);
    const incomingCourseIds = Object.prototype.hasOwnProperty.call(
      req.body,
      "courseIds"
    )
      ? req.body.courseIds
      : Object.prototype.hasOwnProperty.call(req.body, "courseId")
        ? req.body.courseId
        : currentSelectionFallback.courseIds;
    const incomingChapterIds = Object.prototype.hasOwnProperty.call(
      req.body,
      "chapterIds"
    )
      ? req.body.chapterIds
      : Object.prototype.hasOwnProperty.call(req.body, "chapterId")
        ? req.body.chapterId
        : currentSelectionFallback.chapterIds;

    const selection = await validateCourseChapterSelection({
      courseIds: incomingCourseIds,
      chapterIds: incomingChapterIds,
    });

    if (selection.error) {
      return res.status(400).json({ error: selection.error });
    }

    const primaryCourseId = selection.courseIds[0] || null;
    const primaryChapterId = selection.chapterIds[0] || null;

    // Ensure imageUrl is set to thumbnail if not provided
    const updateData = {
      ...req.body,
      courseIds: selection.courseIds,
      chapterIds: selection.chapterIds,
      courseId: primaryCourseId,
      chapterId: primaryChapterId,
      batchId: currentSession.batchId || null,
      batchCode: currentSession.batchCode || null,
      imageUrl: req.body.imageUrl || req.body.thumbnail,
      landingPage: normalizeLandingPagePayload(req.body.landingPage, {
        ...currentSession.toObject(),
        ...req.body,
      }),
    };

    if (!updateData.courseId) delete updateData.courseId;
    if (!updateData.chapterId) delete updateData.chapterId;

    if (Object.prototype.hasOwnProperty.call(req.body, "batchId")) {
      const batchSelection = await validateBatchSelection(req.body.batchId);
      if (batchSelection.error) {
        return res.status(400).json({ error: batchSelection.error });
      }

      updateData.batchId = batchSelection.batchId;
      updateData.batchCode = batchSelection.batchCode;
    }

    const incomingReminderSettings = req.body.reminderSettings || null;
    const existingReminderSettings = currentSession.reminderSettings || {};
    const nextSessionDate = req.body.date ?? currentSession.date;
    const nextSessionTime = req.body.time ?? currentSession.time;
    const existingReminderStatus = String(
      existingReminderSettings.status || ""
    ).toLowerCase();

    if (incomingReminderSettings) {
      if (
        existingReminderStatus === REMINDER_JOB_STATUS.SENDING ||
        existingReminderStatus === REMINDER_JOB_STATUS.SENT
      ) {
        return res.status(400).json({
          error: "Reminder already sent or currently sending",
        });
      }

      const reminderSettings = buildReminderSettingsPayload({
        currentReminderSettings: existingReminderSettings,
        sessionDate: nextSessionDate,
        sessionTime: nextSessionTime,
        incomingReminderSettings,
      });

      if (!reminderSettings.sendAt) {
        return res
          .status(400)
          .json({ error: "Unable to calculate reminder send time" });
      }

      updateData.reminderSettings = reminderSettings;
    } else if (
      existingReminderStatus === REMINDER_JOB_STATUS.QUEUED &&
      (Object.prototype.hasOwnProperty.call(req.body, "date") ||
        Object.prototype.hasOwnProperty.call(req.body, "time"))
    ) {
      const reminderSettings = buildReminderSettingsPayload({
        currentReminderSettings: existingReminderSettings,
        sessionDate: nextSessionDate,
        sessionTime: nextSessionTime,
      });

      if (!reminderSettings.sendAt) {
        return res
          .status(400)
          .json({ error: "Unable to calculate reminder send time" });
      }

      updateData.reminderSettings = reminderSettings;
    }

    const session = await populateLiveSession(
      LiveSession.findByIdAndUpdate(req.params.id, updateData, { new: true })
    );
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.status(200).json(normalizeLiveSessionResponse(session));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteLiveSession = async (req, res) => {
  try {
    const deleted = await LiveSession.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Session not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Toggle between active and inactive in database
    // The dynamic status calculation will handle upcoming/live/completed
    session.status = session.status === "active" ? "inactive" : "active";
    await session.save();

    // Return the session with updated status
    res.status(200).json({
      message: "Session status updated successfully",
      session: {
        _id: session._id,
        title: session.title,
        status: session.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
