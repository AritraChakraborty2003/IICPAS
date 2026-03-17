import OurPartnersSettings from "../models/OurPartnersSettings.js";

const sanitizeText = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const sanitizeDuration = (value, fallback = 18) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(8, Math.min(60, Math.round(parsed)));
};

const sanitizeItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const name = typeof item?.name === "string" ? item.name.trim() : "";
      const logoUrl =
        typeof item?.logoUrl === "string" ? item.logoUrl.trim() : "";

      if (!name || !logoUrl) {
        return null;
      }

      return {
        name: name.slice(0, 64),
        logoUrl,
      };
    })
    .filter(Boolean)
    .slice(0, 20);
};

export const getOurPartnersSettings = async (req, res) => {
  try {
    const settings = await OurPartnersSettings.getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching our partners settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch our partners settings",
      error: error.message,
    });
  }
};

export const upsertOurPartnersSettings = async (req, res) => {
  try {
    let settings = await OurPartnersSettings.findOne();
    if (!settings) {
      settings = new OurPartnersSettings();
    }

    settings.enabled = Boolean(req.body.enabled);
    settings.title = sanitizeText(req.body.title, "Our Partners");
    settings.durationSeconds = sanitizeDuration(req.body.durationSeconds, 18);
    settings.items = sanitizeItems(req.body.items);

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Our partners settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating our partners settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update our partners settings",
      error: error.message,
    });
  }
};
