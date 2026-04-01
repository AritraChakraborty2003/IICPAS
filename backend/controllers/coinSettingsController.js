import CoinSettings from "../models/CoinSettings.js";

const normalizeNonNegativeInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
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
    const quizCompleteCoins = normalizeNonNegativeInt(req.body.quizCompleteCoins);
    const testimonialApprovedCoins = normalizeNonNegativeInt(
      req.body.testimonialApprovedCoins
    );
    const purchaseSuccessCoins = normalizeNonNegativeInt(
      req.body.purchaseSuccessCoins
    );

    if (
      quizCompleteCoins === null ||
      testimonialApprovedCoins === null ||
      purchaseSuccessCoins === null
    ) {
      return res.status(400).json({
        success: false,
        message: "All coin values must be non-negative numbers",
      });
    }

    let settings = await CoinSettings.findOne();
    if (!settings) {
      settings = new CoinSettings();
    }

    settings.quizCompleteCoins = quizCompleteCoins;
    settings.testimonialApprovedCoins = testimonialApprovedCoins;
    settings.purchaseSuccessCoins = purchaseSuccessCoins;

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
