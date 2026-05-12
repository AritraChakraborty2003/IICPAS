import BatchManager from "../models/BatchManager.js";
import BatchAllocationState from "../models/BatchAllocationState.js";
import BatchSequence from "../models/BatchSequence.js";

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

const getNextBatchSequence = async (session = null) => {
  const result = await BatchSequence.findOneAndUpdate(
    { key: GLOBAL_BATCH_SEQUENCE_KEY },
    {
      $inc: { value: 1 },
      $setOnInsert: { key: GLOBAL_BATCH_SEQUENCE_KEY, value: 0 },
    },
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
  if (batch.assignedCount === 0 && created) {
    await batch.deleteOne({ session });
    return null;
  }

  await batch.save({ session });
  return batch;
};
