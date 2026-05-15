import BatchManager from "../models/BatchManager.js";
import Student from "../models/Students.js";
import {
  buildBatchSummary,
  generateNextBatchCode,
  normalizeBatchMode,
  normalizeBatchSize,
} from "../services/batchAssignmentService.js";

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
