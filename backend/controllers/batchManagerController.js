import BatchManager from "../models/BatchManager.js";
import {
  buildBatchSummary,
  generateNextBatchCode,
  normalizeBatchMode,
  normalizeBatchSize,
} from "../services/batchAssignmentService.js";

const backfillMissingBatchMetadata = async () => {
  const batchesWithMissingCode = await BatchManager.find({
    $or: [
      { code: { $exists: false } },
      { code: null },
      { code: "" },
    ],
  }).sort({ createdAt: 1 });

  for (const batch of batchesWithMissingCode) {
    batch.code = await generateNextBatchCode();
    if (!Number.isFinite(Number(batch.assignedCount)) || Number(batch.assignedCount) < 0) {
      batch.assignedCount = 0;
    }
    await batch.save();
  }
};

export const getBatchManagerEntries = async (req, res) => {
  try {
    await backfillMissingBatchMetadata();
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
      assignedCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch: buildBatchSummary(batch),
    });
  } catch (error) {
    console.error("Error creating batch:", error);
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

    if (Number(batch.assignedCount || 0) > 0) {
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
