import BatchManager from "../models/BatchManager.js";

const normalizeMode = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "online" || normalized === "offline") return normalized;
  return null;
};

const normalizeSize = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.trunc(parsed);
};

export const getBatchManagerEntries = async (req, res) => {
  try {
    const batches = await BatchManager.getBatches();
    return res.status(200).json({ success: true, batches });
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
    const mode = normalizeMode(req.body.mode);
    const size = normalizeSize(req.body.size);

    if (!mode || !size) {
      return res.status(400).json({
        success: false,
        message: "Mode and size are required",
      });
    }

    const batch = await BatchManager.create({ mode, size });

    return res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch,
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
    const mode = normalizeMode(req.body.mode);
    const size = normalizeSize(req.body.size);

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

    batch.mode = mode;
    batch.size = size;
    await batch.save();

    return res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      batch,
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
    const batch = await BatchManager.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

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
