import CoinSettings from "../models/CoinSettings.js";

const normalizeNonNegativeInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
};

const normalizeDiscountPercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return Number(parsed.toFixed(2));
};

export const getCoinSettings = async (req, res) => {
  try {
    const settings = await CoinSettings.getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching coin settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coin settings",
      error: error.message,
    });
  }
};

export const updateCoinSettings = async (req, res) => {
  try {
    const payload = req.body || {};
    const fieldParsers = {
      quizCompleteCoins: normalizeNonNegativeInt,
      testimonialApprovedCoins: normalizeNonNegativeInt,
      purchaseSuccessCoins: normalizeNonNegativeInt,
      referralSignupCoins: normalizeNonNegativeInt,
      referralUsageCoins: normalizeNonNegativeInt,
      referralUsageDiscountPercent: normalizeDiscountPercent,
    };

    const settings = await CoinSettings.getSettings();
    let hasUpdate = false;

    for (const [field, parser] of Object.entries(fieldParsers)) {
      if (payload[field] === undefined) continue;
      hasUpdate = true;
      const normalized = parser(payload[field]);
      if (normalized === null) {
        return res.status(400).json({
          success: false,
          message:
            field === "referralUsageDiscountPercent"
              ? "Referral discount must be a number between 0 and 100"
              : `${field} must be a non-negative number`,
        });
      }
      settings[field] = normalized;
    }

    if (!hasUpdate) {
      return res.status(400).json({
        success: false,
        message: "No valid settings fields were provided",
      });
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Coin settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating coin settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update coin settings",
      error: error.message,
    });
  }
};
