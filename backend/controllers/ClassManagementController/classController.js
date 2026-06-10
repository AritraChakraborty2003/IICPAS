import ClassSession from "../../models/ClassManagement/ClassSession.js";
import Course from "../../models/Content/Course.js";
import {
  computeClassWindow,
  deriveLiveStatus,
} from "../../utils/classScheduleHelpers.js";

const POPULATE = [
  { path: "course", select: "title category slug image" },
  { path: "chapter", select: "title" },
  { path: "topic", select: "title" },
];

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
    if (course) filter.course = course;
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
      course: req.params.courseId,
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

// POST /api/classes
export const createClass = async (req, res) => {
  try {
    const {
      title,
      description = "",
      instructor = "",
      course,
      chapter = null,
      topic = null,
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

    if (!title || !course || !date || !time) {
      return res
        .status(400)
        .json({ message: "title, course, date and time are required" });
    }

    const courseExists = await Course.exists({ _id: course });
    if (!courseExists) {
      return res.status(400).json({ message: "Course not found" });
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
      course,
      chapter: chapter || null,
      topic: topic || null,
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
      "course",
      "chapter",
      "topic",
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
