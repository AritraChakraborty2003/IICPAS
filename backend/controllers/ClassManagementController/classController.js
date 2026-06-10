import mongoose from "mongoose";
import ClassSession from "../../models/ClassManagement/ClassSession.js";
import Course from "../../models/Content/Course.js";
import Student from "../../models/Students.js";
import {
  computeClassWindow,
  deriveLiveStatus,
} from "../../utils/classScheduleHelpers.js";

const POPULATE = [
  { path: "courses", select: "title category slug image" },
  { path: "chapters", select: "title" },
  { path: "topics", select: "title" },
];

// Normalize a value into a clean array of ids (drops empties/duplicates)
const toIdArray = (value) => {
  if (value === undefined || value === null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return Array.from(
    new Set(arr.map((v) => String(v?._id || v || "")).filter(Boolean))
  );
};

/**
 * Apply on-read status: if a live class window has elapsed, reflect it as
 * "recorded" in the returned object even before the background job runs.
 * Returns a plain object.
 */
const withResolvedType = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const liveStatus = deriveLiveStatus(obj.startAt, obj.endAt);
  // Reflect computed lifecycle if not cancelled
  if (obj.status !== "cancelled") {
    obj.status = liveStatus;
  }
  // If the window is over, present it as recorded
  if (liveStatus === "completed" && obj.type === "live") {
    obj.type = "recorded";
  }
  return obj;
};

// GET /api/classes  (admin: all; supports ?type=live|recorded, ?course=, ?active=)
export const getAllClasses = async (req, res) => {
  try {
    const { type, course, active } = req.query;
    const filter = {};
    if (course) filter.courses = course;
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    let classes = await ClassSession.find(filter)
      .populate(POPULATE)
      .sort({ startAt: -1 })
      .lean();

    classes = classes.map(withResolvedType);

    // type filter is applied AFTER resolving (so auto-converted live show as recorded)
    if (type === "live" || type === "recorded") {
      classes = classes.filter((c) => c.type === type);
    }

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/classes/:id
export const getClassById = async (req, res) => {
  try {
    const cls = await ClassSession.findById(req.params.id).populate(POPULATE);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(withResolvedType(cls));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/classes/course/:courseId  (student-facing: classes for a course)
export const getClassesByCourse = async (req, res) => {
  try {
    const { type } = req.query;
    let classes = await ClassSession.find({
      courses: req.params.courseId,
      isActive: true,
    })
      .populate(POPULATE)
      .sort({ startAt: -1 })
      .lean();

    classes = classes.map(withResolvedType);
    if (type === "live" || type === "recorded") {
      classes = classes.filter((c) => c.type === type);
    }

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/classes/for-student/:studentId
// Returns the student's classes (only for purchased/enrolled courses), with
// each class' type resolved (a finished live class is presented as recorded).
// Supports ?type=live|recorded to fetch one bucket.
export const getClassesForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findById(studentId)
      .select("course courseAccessOverrides")
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Collect purchased course IDs (direct course array + unlocked overrides)
    const purchasedCourseIds = new Set(
      (Array.isArray(student.course) ? student.course : []).map((id) =>
        String(id)
      )
    );
    if (Array.isArray(student.courseAccessOverrides)) {
      student.courseAccessOverrides.forEach((entry) => {
        if (entry && !entry.isLocked && entry.courseId) {
          purchasedCourseIds.add(String(entry.courseId));
        }
      });
    }

    if (purchasedCourseIds.size === 0) {
      return res.status(200).json([]);
    }

    let classes = await ClassSession.find({
      isActive: true,
      courses: { $in: Array.from(purchasedCourseIds) },
    })
      .populate(POPULATE)
      .sort({ startAt: -1 })
      .lean();

    classes = classes.map(withResolvedType);

    const { type } = req.query;
    if (type === "live" || type === "recorded") {
      classes = classes.filter((c) => c.type === type);
    }

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/classes
export const createClass = async (req, res) => {
  try {
    const {
      title,
      description = "",
      instructor = "",
      courses: coursesInput,
      course, // legacy single-value support
      chapters: chaptersInput,
      topics: topicsInput,
      date,
      time,
      durationMinutes = 60,
      timezone = "Asia/Kolkata",
      meetingLink = "",
      recordingUrl = "",
      thumbnail = "",
      price = 0,
      maxParticipants = 100,
    } = req.body;

    const courses = toIdArray(coursesInput ?? course);
    const chapters = toIdArray(chaptersInput);
    const topics = toIdArray(topicsInput);

    if (!title || courses.length === 0 || !date || !time) {
      return res.status(400).json({
        message: "title, at least one course, date and time are required",
      });
    }

    const courseCount = await Course.countDocuments({ _id: { $in: courses } });
    if (courseCount !== courses.length) {
      return res.status(400).json({ message: "One or more courses not found" });
    }

    const { startAt, endAt } = computeClassWindow(
      date,
      time,
      durationMinutes,
      timezone
    );

    const cls = await ClassSession.create({
      title,
      description,
      instructor,
      courses,
      chapters,
      topics,
      type: "live",
      date,
      time,
      durationMinutes,
      timezone,
      startAt,
      endAt,
      meetingLink,
      recordingUrl,
      thumbnail,
      price,
      maxParticipants,
      status: deriveLiveStatus(startAt, endAt),
    });

    const populated = await cls.populate(POPULATE);
    res.status(201).json(withResolvedType(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/classes/:id
export const updateClass = async (req, res) => {
  try {
    const cls = await ClassSession.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const fields = [
      "title",
      "description",
      "instructor",
      "type",
      "date",
      "time",
      "durationMinutes",
      "timezone",
      "meetingLink",
      "recordingUrl",
      "thumbnail",
      "price",
      "maxParticipants",
      "status",
      "isActive",
    ];

    for (const f of fields) {
      if (req.body[f] !== undefined) cls[f] = req.body[f];
    }

    // Multi-select relations
    if (req.body.courses !== undefined || req.body.course !== undefined) {
      cls.courses = toIdArray(req.body.courses ?? req.body.course);
    }
    if (req.body.chapters !== undefined) {
      cls.chapters = toIdArray(req.body.chapters);
    }
    if (req.body.topics !== undefined) {
      cls.topics = toIdArray(req.body.topics);
    }

    // Recompute the schedule window if any timing input changed
    if (
      req.body.date !== undefined ||
      req.body.time !== undefined ||
      req.body.durationMinutes !== undefined ||
      req.body.timezone !== undefined
    ) {
      const { startAt, endAt } = computeClassWindow(
        cls.date,
        cls.time,
        cls.durationMinutes,
        cls.timezone
      );
      cls.startAt = startAt;
      cls.endAt = endAt;
      // Re-open auto-convert if the schedule was pushed into the future
      if (deriveLiveStatus(startAt, endAt) !== "completed") {
        cls.autoConverted = false;
        cls.convertedAt = null;
        if (cls.type === "recorded" && !req.body.type) cls.type = "live";
      }
    }

    await cls.save();
    const populated = await cls.populate(POPULATE);
    res.status(200).json(withResolvedType(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/classes/:id
export const deleteClass = async (req, res) => {
  try {
    const cls = await ClassSession.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.status(200).json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/classes/:id/toggle  (active/inactive)
export const toggleClassActive = async (req, res) => {
  try {
    const cls = await ClassSession.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    cls.isActive = !cls.isActive;
    await cls.save();
    res.status(200).json({ message: "Status updated", isActive: cls.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/classes/:id/convert  (manual force-convert live -> recorded)
export const convertToRecorded = async (req, res) => {
  try {
    const cls = await ClassSession.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    cls.type = "recorded";
    cls.status = "completed";
    cls.autoConverted = true;
    cls.convertedAt = new Date();
    if (req.body.recordingUrl !== undefined) {
      cls.recordingUrl = req.body.recordingUrl;
    }
    await cls.save();
    const populated = await cls.populate(POPULATE);
    res.status(200).json(populated.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
