import BookingSettings from "../models/BookingSettings.js";

const normalizePercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return Number(parsed.toFixed(2));
};

export const getBookingSettings = async (req, res) => {
  try {
    const settings = await BookingSettings.getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching booking settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking settings",
      error: error.message,
    });
  }
};

export const upsertBookingSettings = async (req, res) => {
  try {
    const singleCourseBookingPercent = normalizePercent(
      req.body.singleCourseBookingPercent
    );
    const groupPackageBookingPercent = normalizePercent(
      req.body.groupPackageBookingPercent
    );

    if (
      singleCourseBookingPercent === null ||
      groupPackageBookingPercent === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Both percentages must be valid values between 0 and 100",
      });
    }

    let settings = await BookingSettings.findOne();
    if (!settings) {
      settings = new BookingSettings();
    }

    settings.singleCourseBookingPercent = singleCourseBookingPercent;
    settings.groupPackageBookingPercent = groupPackageBookingPercent;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Booking settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating booking settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking settings",
      error: error.message,
    });
  }
};
