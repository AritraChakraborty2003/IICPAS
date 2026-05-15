import BatchManager from "../models/BatchManager.js";
import BatchAllocationState from "../models/BatchAllocationState.js";
import BatchSequence from "../models/BatchSequence.js";
import Student from "../models/Students.js";

export const BATCH_CODE_PREFIX = "IICPA-BT-";
const GLOBAL_BATCH_SEQUENCE_KEY = "BATCH_CODE";

export const normalizeBatchMode = (value, fallback = null) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "online" || normalized === "offline") return normalized;
  return fallback;
};

export const normalizeBatchSize = (value, fallback = null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.trunc(parsed);
};

export const formatBatchCode = (sequence) => {
  const numeric = Math.max(1, Number(sequence) || 1);
  return `${BATCH_CODE_PREFIX}${String(numeric).padStart(2, "0")}`;
};

export const buildBatchSummary = (batch) => {
  if (!batch) return null;
  const plain = batch?.toObject ? batch.toObject() : { ...batch };
  const assignedCount = Number(plain.assignedCount || 0);
  const size = Number(plain.size || 0);
  const remainingSeats = Math.max(size - assignedCount, 0);
  const occupancyPercent = size > 0 ? Math.min(100, Math.round((assignedCount / size) * 100)) : 0;

  return {
    ...plain,
    assignedCount,
    size,
    remainingSeats,
    occupancyPercent,
    isFull: size > 0 ? assignedCount >= size : false,
  };
};

const getMaxExistingBatchSequence = async (session = null) => {
  const batches = await BatchManager.find({
    code: { $regex: `^${BATCH_CODE_PREFIX}` },
  })
    .select("code")
    .session(session)
    .lean();

  return batches.reduce((max, batch) => {
    const numeric = Number(String(batch?.code || "").replace(BATCH_CODE_PREFIX, ""));
    if (!Number.isFinite(numeric)) return max;
    return Math.max(max, numeric);
  }, 0);
};

const getNextBatchSequence = async (session = null) => {
  const maxExistingSequence = await getMaxExistingBatchSequence(session);

  try {
    await BatchSequence.updateOne(
      { key: GLOBAL_BATCH_SEQUENCE_KEY },
      {
        $setOnInsert: {
          key: GLOBAL_BATCH_SEQUENCE_KEY,
          value: 0,
        },
      },
      { upsert: true, session }
    );
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }

  await BatchSequence.updateOne(
    {
      key: GLOBAL_BATCH_SEQUENCE_KEY,
      value: { $lt: maxExistingSequence },
    },
    {
      $set: { value: maxExistingSequence },
    },
    { session }
  );

  const result = await BatchSequence.findOneAndUpdate(
    { key: GLOBAL_BATCH_SEQUENCE_KEY },
    { $inc: { value: 1 } },
    { new: true, upsert: true, session }
  );

  return Number(result?.value || 1);
};

export const generateNextBatchCode = async (session = null) => {
  const nextSequence = await getNextBatchSequence(session);
  return formatBatchCode(nextSequence);
};

export const getDefaultBatchSizeForMode = async (mode, session = null) => {
  const latestBatch = await BatchManager.findOne({ mode })
    .sort({ createdAt: -1 })
    .select("size")
    .session(session);

  return normalizeBatchSize(latestBatch?.size, 100) || 100;
};

const findOpenBatchForMode = async (mode, session = null) => {
  return BatchManager.findOne({
    mode,
    $expr: {
      $lt: [
        { $ifNull: ["$assignedCount", 0] },
        { $ifNull: ["$size", 0] },
      ],
    },
  })
    .sort({ createdAt: 1 })
    .session(session);
};

const deleteBatchIfEmpty = async (batch, session = null) => {
  if (!batch || Number(batch.assignedCount || 0) > 0) {
    return batch;
  }

  return batch;
};

export const reserveBatchSeat = async ({ mode, size, session = null } = {}) => {
  const normalizedMode = normalizeBatchMode(mode);
  if (!normalizedMode) {
    return { batch: null, created: false };
  }

  const allocationState = await BatchAllocationState.findOneAndUpdate(
    { mode: normalizedMode },
    { $setOnInsert: { mode: normalizedMode } },
    { new: true, upsert: true, session }
  );

  let openBatch = null;
  if (allocationState?.activeBatchId) {
    openBatch = await BatchManager.findById(allocationState.activeBatchId).session(session);
  }

  if (!openBatch || Number(openBatch.assignedCount || 0) >= Number(openBatch.size || 0)) {
    openBatch = await findOpenBatchForMode(normalizedMode, session);
  }

  if (openBatch) {
    if (!openBatch.code) {
      openBatch.code = await generateNextBatchCode(session);
    }

    openBatch.assignedCount = Number(openBatch.assignedCount || 0) + 1;
    await openBatch.save({ session });

    allocationState.activeBatchId = openBatch._id;
    allocationState.activeBatchCode = openBatch.code;
    allocationState.lastAllocatedAt = new Date();
    await allocationState.save({ session });

    return { batch: openBatch, created: false };
  }

  const batchSize =
    normalizeBatchSize(size, null) || (await getDefaultBatchSizeForMode(normalizedMode, session));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const code = await generateNextBatchCode(session);
      const [createdBatch] = await BatchManager.create(
        [
          {
            code,
            mode: normalizedMode,
            size: batchSize,
            assignedCount: 1,
          },
        ],
        { session }
      );

      allocationState.activeBatchId = createdBatch._id;
      allocationState.activeBatchCode = createdBatch.code;
      allocationState.lastAllocatedAt = new Date();
      await allocationState.save({ session });

      return { batch: createdBatch, created: true };
    } catch (error) {
      if (error?.code === 11000 && String(error?.keyPattern?.code || "").includes("code")) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate batch code");
};

export const releaseBatchSeat = async ({ batchId, created = false, session = null } = {}) => {
  if (!batchId) return null;

  const batch = await BatchManager.findById(batchId).session(session);
  if (!batch) return null;

  batch.assignedCount = Math.max(0, Number(batch.assignedCount || 0) - 1);
  await batch.save({ session });
  return deleteBatchIfEmpty(batch, session);
};

const createBatchTransferError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const transferStudentBatchSeat = async ({
  studentId,
  targetBatchId,
  session = null,
} = {}) => {
  if (!studentId) {
    throw createBatchTransferError("studentId is required", 400);
  }

  if (!targetBatchId) {
    throw createBatchTransferError("batchId is required", 400);
  }

  const student = await Student.findById(studentId).session(session);
  if (!student) {
    throw createBatchTransferError("Student not found", 404);
  }

  const normalizedTargetBatchId = String(targetBatchId);
  const currentBatchId = student.batchId ? String(student.batchId) : "";

  if (currentBatchId && currentBatchId === normalizedTargetBatchId) {
    const currentBatch = await BatchManager.findById(normalizedTargetBatchId).session(session);
    if (!currentBatch) {
      throw createBatchTransferError("Target batch not found", 404);
    }

    return {
      student,
      batch: buildBatchSummary(currentBatch),
      previousBatch: buildBatchSummary(currentBatch),
      changed: false,
    };
  }

  const targetBatch = await BatchManager.findById(normalizedTargetBatchId).session(session);
  if (!targetBatch) {
    throw createBatchTransferError("Target batch not found", 404);
  }

  const studentBatchMode = normalizeBatchMode(student.batchMode || student.mode);
  if (studentBatchMode && normalizeBatchMode(targetBatch.mode) !== studentBatchMode) {
    throw createBatchTransferError("Target batch mode does not match the student batch mode", 400);
  }

  const targetBatchSize = Number(targetBatch.size || 0);
  const targetAssignedCount = Number(targetBatch.assignedCount || 0);
  if (targetBatchSize > 0 && targetAssignedCount >= targetBatchSize) {
    throw createBatchTransferError("Target batch is full", 400);
  }

  let previousBatch = null;
  if (currentBatchId) {
    previousBatch = await BatchManager.findById(currentBatchId).session(session);
    if (!previousBatch) {
      throw createBatchTransferError("Current batch not found for this student", 404);
    }

  const decrementedBatch = await BatchManager.findOneAndUpdate(
      {
        _id: previousBatch._id,
        assignedCount: { $gt: 0 },
      },
      {
        $inc: { assignedCount: -1 },
      },
      {
        new: true,
        session,
      }
    );

    if (!decrementedBatch) {
      throw createBatchTransferError("Current batch seat count is inconsistent", 409);
    }

    if (Number(decrementedBatch.assignedCount || 0) === 0) {
      await BatchManager.deleteOne({ _id: decrementedBatch._id }).session(session);
    }

    previousBatch = decrementedBatch;
  }

  const incrementedBatch = await BatchManager.findOneAndUpdate(
    {
      _id: targetBatch._id,
      $expr: {
        $lt: [
          { $ifNull: ["$assignedCount", 0] },
          { $ifNull: ["$size", 0] },
        ],
      },
    },
    {
      $inc: { assignedCount: 1 },
    },
    {
      new: true,
      session,
    }
  );

  if (!incrementedBatch) {
    throw createBatchTransferError("Target batch is full", 400);
  }

  const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      {
        $set: {
          batchId: incrementedBatch._id,
          batchCode: incrementedBatch.code || null,
          batchMode: incrementedBatch.mode || null,
          batchAssignedAt: new Date(),
        },
      },
      {
        new: true,
        session,
      }
    )
    .populate("batchId", "code mode size assignedCount");

  return {
    student: updatedStudent,
    batch: buildBatchSummary(incrementedBatch),
    previousBatch: buildBatchSummary(previousBatch),
    changed: true,
  };
};
