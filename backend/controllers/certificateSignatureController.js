import CertificateSignatureSettings from "../models/CertificateSignatureSettings.js";

export const getCertificateSignatures = async (req, res) => {
  try {
    const settings = await CertificateSignatureSettings.getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching certificate signature settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch signature settings",
      error: error.message,
    });
  }
};

export const updateCertificateSignatures = async (req, res) => {
  try {
    let settings = await CertificateSignatureSettings.findOne();
    if (!settings) {
      settings = new CertificateSignatureSettings();
    }

    if (req.body.lokeshTitle !== undefined) {
      settings.lokeshTitle = req.body.lokeshTitle;
    }
    if (req.body.lokeshSubTitle !== undefined) {
      settings.lokeshSubTitle = req.body.lokeshSubTitle;
    }
    if (req.body.poonamTitle !== undefined) {
      settings.poonamTitle = req.body.poonamTitle;
    }
    if (req.body.poonamSubTitle !== undefined) {
      settings.poonamSubTitle = req.body.poonamSubTitle;
    }

    if (req.files?.lokeshSign?.[0]) {
      const file = req.files.lokeshSign[0];
      settings.lokeshSign = `/uploads/signatures/${file.filename}`;
    }

    if (req.files?.poonamSign?.[0]) {
      const file = req.files.poonamSign[0];
      settings.poonamSign = `/uploads/signatures/${file.filename}`;
    }

    // Support resetting signatures via text fields if sent as empty string or delete flag
    if (req.body.deleteLokeshSign === "true") {
      settings.lokeshSign = "";
    }
    if (req.body.deletePoonamSign === "true") {
      settings.poonamSign = "";
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Certificate signatures updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating certificate signature settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update certificate signature settings",
      error: error.message,
    });
  }
};
