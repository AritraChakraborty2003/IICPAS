import InvoiceCompanySettings from "../models/InvoiceCompanySettings.js";

const normalizeString = (value) => String(value ?? "").trim();

const normalizeUpper = (value) => normalizeString(value).toUpperCase();

const isValidEmail = (value) =>
  value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidGSTIN = (value) =>
  value === "" ||
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(value);

const isValidCIN = (value) =>
  value === "" || /^[A-Z0-9]{21}$/.test(value);

const isValidPAN = (value) =>
  value === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value);

export const getInvoiceCompanySettings = async (req, res) => {
  try {
    const settings = await InvoiceCompanySettings.getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching invoice company settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice company settings",
      error: error.message,
    });
  }
};

export const upsertInvoiceCompanySettings = async (req, res) => {
  try {
    const payload = {
      companyName: normalizeString(req.body.companyName),
      legalName: normalizeString(req.body.legalName),
      email: normalizeString(req.body.email).toLowerCase(),
      phone: normalizeString(req.body.phone),
      website: normalizeString(req.body.website),
      gstin: normalizeUpper(req.body.gstin),
      cin: normalizeUpper(req.body.cin),
      pan: normalizeUpper(req.body.pan),
      addressLine1: normalizeString(req.body.addressLine1),
      addressLine2: normalizeString(req.body.addressLine2),
      city: normalizeString(req.body.city),
      state: normalizeString(req.body.state),
      pincode: normalizeString(req.body.pincode),
      country: normalizeString(req.body.country),
      invoicePrefix: normalizeUpper(req.body.invoicePrefix),
      supportEmail: normalizeString(req.body.supportEmail).toLowerCase(),
      supportPhone: normalizeString(req.body.supportPhone),
      bankName: normalizeString(req.body.bankName),
      accountName: normalizeString(req.body.accountName),
      accountNumber: normalizeString(req.body.accountNumber),
      ifsc: normalizeUpper(req.body.ifsc),
      upiId: normalizeString(req.body.upiId),
      invoiceNotes: normalizeString(req.body.invoiceNotes),
    };

    if (!payload.companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    if (!isValidEmail(payload.email) || !isValidEmail(payload.supportEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid email address values",
      });
    }

    if (!isValidGSTIN(payload.gstin)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GSTIN format",
      });
    }

    if (!isValidCIN(payload.cin)) {
      return res.status(400).json({
        success: false,
        message: "Invalid CIN format",
      });
    }

    if (!isValidPAN(payload.pan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN format",
      });
    }

    let settings = await InvoiceCompanySettings.findOne();
    if (!settings) {
      settings = new InvoiceCompanySettings();
    }

    Object.assign(settings, payload);
    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Invoice company settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating invoice company settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invoice company settings",
      error: error.message,
    });
  }
};
