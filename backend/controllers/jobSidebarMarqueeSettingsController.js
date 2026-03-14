import JobSidebarMarqueeSettings from "../models/JobSidebarMarqueeSettings.js";

const ALLOWED_ICONS = new Set([
  "briefcase",
  "building",
  "calculator",
  "fileText",
  "badgeCheck",
  "chart",
  "mapPin",
  "wallet",
  "users",
  "target",
]);

const DEFAULT_ITEMS = [
  { icon: "briefcase", label: "Openings" },
  { icon: "building", label: "Companies" },
  { icon: "calculator", label: "Accounts" },
  { icon: "fileText", label: "CV Ready" },
  { icon: "badgeCheck", label: "Verified" },
  { icon: "chart", label: "Growth" },
];

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
  if (!Array.isArray(items)) return DEFAULT_ITEMS;

  const sanitized = items
    .map((item) => {
      const icon = typeof item?.icon === "string" ? item.icon.trim() : "";
      const label = typeof item?.label === "string" ? item.label.trim() : "";

      if (!ALLOWED_ICONS.has(icon) || !label) {
        return null;
      }

      return { icon, label: label.slice(0, 24) };
    })
    .filter(Boolean)
    .slice(0, 12);

  return sanitized.length ? sanitized : DEFAULT_ITEMS;
};

export const getJobSidebarMarqueeSettings = async (req, res) => {
  try {
    const settings = await JobSidebarMarqueeSettings.getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching job sidebar marquee settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job sidebar marquee settings",
      error: error.message,
    });
  }
};

export const upsertJobSidebarMarqueeSettings = async (req, res) => {
  try {
    let settings = await JobSidebarMarqueeSettings.findOne();
    if (!settings) {
      settings = new JobSidebarMarqueeSettings();
    }

    settings.enabled = Boolean(req.body.enabled);
    settings.title = sanitizeText(req.body.title, "Career Tools");
    settings.subtitle = sanitizeText(
      req.body.subtitle,
      "Finance and accounting job essentials"
    );
    settings.durationSeconds = sanitizeDuration(req.body.durationSeconds, 18);
    settings.items = sanitizeItems(req.body.items);

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Job sidebar marquee settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating job sidebar marquee settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update job sidebar marquee settings",
      error: error.message,
    });
  }
};
