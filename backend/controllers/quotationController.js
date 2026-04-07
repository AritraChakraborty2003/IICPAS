import Quotation from "../models/Quotation.js";
import QuotationCustomer from "../models/QuotationCustomer.js";
import QuotationSequence from "../models/QuotationSequence.js";
import InvoiceCompanySettings from "../models/InvoiceCompanySettings.js";

const normalizeString = (value) => String(value ?? "").trim();
const normalizeUpper = (value) => normalizeString(value).toUpperCase();
const money = (value) => Number((Number(value || 0) || 0).toFixed(2));

const clampPercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, money(parsed)));
};

const buildQuoteNumber = async (prefix) => {
  const normalizedPrefix = normalizeUpper(prefix) || "QTN";
  const result = await QuotationSequence.findOneAndUpdate(
    { prefix: normalizedPrefix },
    { $inc: { value: 1 }, $setOnInsert: { prefix: normalizedPrefix } },
    { new: true, upsert: true }
  );
  const padded = String(result.value || 1).padStart(4, "0");
  return `${normalizedPrefix}-${padded}`;
};

const normalizeCustomerPayload = (payload = {}) => ({
  customerName: normalizeString(payload.customerName),
  companyName: normalizeString(payload.companyName),
  gstin: normalizeUpper(payload.gstin),
  email: normalizeString(payload.email).toLowerCase(),
  phone: normalizeString(payload.phone),
  billingAddress: normalizeString(payload.billingAddress),
  shippingAddress: normalizeString(payload.shippingAddress),
  billingState: normalizeString(payload.billingState),
  shippingState: normalizeString(payload.shippingState),
  city: normalizeString(payload.city),
  pincode: normalizeString(payload.pincode),
  country: normalizeString(payload.country) || "India",
});

const normalizeQuotationPayload = async (payload = {}, reqUser = null) => {
  const companySettings = await InvoiceCompanySettings.getSettings();
  const company = {
    companyName: normalizeString(payload.company?.companyName) || companySettings.companyName,
    legalName: normalizeString(payload.company?.legalName) || companySettings.legalName,
    email: normalizeString(payload.company?.email) || companySettings.email,
    phone: normalizeString(payload.company?.phone) || companySettings.phone,
    website: normalizeString(payload.company?.website) || companySettings.website,
    gstin: normalizeUpper(payload.company?.gstin) || companySettings.gstin,
    addressLine1:
      normalizeString(payload.company?.addressLine1) || companySettings.addressLine1,
    addressLine2:
      normalizeString(payload.company?.addressLine2) || companySettings.addressLine2,
    city: normalizeString(payload.company?.city) || companySettings.city,
    state: normalizeString(payload.company?.state) || companySettings.state,
    pincode: normalizeString(payload.company?.pincode) || companySettings.pincode,
    country: normalizeString(payload.company?.country) || companySettings.country || "India",
    invoicePrefix:
      normalizeUpper(payload.company?.invoicePrefix) || companySettings.invoicePrefix || "QTN",
    invoiceNotes: normalizeString(payload.company?.invoiceNotes) || companySettings.invoiceNotes,
  };

  const customer = normalizeCustomerPayload(payload.customer);
  const items = Array.isArray(payload.items)
    ? payload.items.map((item) => ({
        description: normalizeString(item.description),
        hsnSac: normalizeString(item.hsnSac),
        quantity: Number(item.quantity || 0),
        unit: normalizeString(item.unit) || "NOS",
        rate: money(item.rate),
        discountType: item.discountType === "flat" ? "flat" : "percent",
        discountValue: money(item.discountValue),
        gstRate: clampPercent(item.gstRate),
      }))
    : [];

  const companyState = normalizeString(company.state).toLowerCase();
  const shippingState = normalizeString(customer.shippingState || customer.billingState).toLowerCase();
  const isInterstate = Boolean(companyState && shippingState && companyState !== shippingState);

  const lineSummaries = items.map((item) => {
    const grossAmount = money(Number(item.quantity || 0) * Number(item.rate || 0));
    const itemDiscountAmount =
      item.discountType === "percent"
        ? money((grossAmount * Number(item.discountValue || 0)) / 100)
        : money(item.discountValue || 0);
    const adjustedTaxableAmount = Math.max(0, money(grossAmount - itemDiscountAmount));
    const cgstRate = isInterstate ? 0 : money(Number(item.gstRate || 0) / 2);
    const sgstRate = isInterstate ? 0 : money(Number(item.gstRate || 0) / 2);
    const igstRate = isInterstate ? money(Number(item.gstRate || 0)) : 0;
    const cgstAmount = isInterstate ? 0 : money((adjustedTaxableAmount * cgstRate) / 100);
    const sgstAmount = isInterstate ? 0 : money((adjustedTaxableAmount * sgstRate) / 100);
    const igstAmount = isInterstate ? money((adjustedTaxableAmount * igstRate) / 100) : 0;
    const totalAmount = money(
      adjustedTaxableAmount + cgstAmount + sgstAmount + igstAmount
    );

    return {
      ...item,
      grossAmount,
      itemDiscountAmount,
      adjustedTaxableAmount,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
    };
  });

  const subtotal = money(lineSummaries.reduce((sum, item) => sum + item.grossAmount, 0));
  const itemDiscountTotal = money(
    lineSummaries.reduce((sum, item) => sum + item.itemDiscountAmount, 0)
  );
  const netAfterItemDiscount = Math.max(0, money(subtotal - itemDiscountTotal));
  const overallDiscountType = payload.overallDiscountType === "flat" ? "flat" : "percent";
  const overallDiscountAmount =
    overallDiscountType === "percent"
      ? money((netAfterItemDiscount * Number(payload.overallDiscountValue || 0)) / 100)
      : money(payload.overallDiscountValue || 0);
  const taxableAmount = Math.max(
    0,
    money(netAfterItemDiscount - overallDiscountAmount)
  );
  const allocationFactor = netAfterItemDiscount > 0 ? taxableAmount / netAfterItemDiscount : 1;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const allocatedLines = lineSummaries.map((line) => {
    const taxablePortion = money(line.adjustedTaxableAmount * allocationFactor);
    let lineCgst = 0;
    let lineSgst = 0;
    let lineIgst = 0;

    if (isInterstate) {
      lineIgst = money((taxablePortion * line.igstRate) / 100);
      igstAmount += lineIgst;
    } else {
      lineCgst = money((taxablePortion * line.cgstRate) / 100);
      lineSgst = money((taxablePortion * line.sgstRate) / 100);
      cgstAmount += lineCgst;
      sgstAmount += lineSgst;
    }

    return {
      ...line,
      adjustedTaxableAmount: taxablePortion,
      cgstAmount: lineCgst,
      sgstAmount: lineSgst,
      igstAmount: lineIgst,
      totalAmount: money(taxablePortion + lineCgst + lineSgst + lineIgst),
    };
  });

  return {
    quoteNumber: normalizeString(payload.quoteNumber),
    quoteDate: normalizeString(payload.quoteDate),
    validUntil: normalizeString(payload.validUntil),
    subject: normalizeString(payload.subject),
    notes: normalizeString(payload.notes),
    terms: normalizeString(payload.terms),
    company,
    customer,
    items,
    overallDiscountType,
    overallDiscountValue: money(payload.overallDiscountValue || 0),
    calculations: {
      isInterstate,
      subtotal,
      itemDiscountTotal,
      overallDiscountAmount,
      taxableAmount,
      cgstAmount: money(cgstAmount),
      sgstAmount: money(sgstAmount),
      igstAmount: money(igstAmount),
      grandTotal: money(taxableAmount + cgstAmount + sgstAmount + igstAmount),
    },
    lineSummaries: allocatedLines,
    metadata: {
      createdBy: reqUser?._id || null,
      updatedBy: reqUser?._id || null,
      source: "dashboard",
    },
  };
};

export const getQuotationCustomers = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const customers = await QuotationCustomer.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error("Error fetching quotation customers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation customers",
      error: error.message,
    });
  }
};

export const upsertQuotationCustomer = async (req, res) => {
  try {
    const payload = normalizeCustomerPayload(req.body);
    if (!payload.customerName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const id = normalizeString(req.body.id);
    let customer = id ? await QuotationCustomer.findById(id) : null;
    if (!customer) {
      customer = new QuotationCustomer({
        ...payload,
        metadata: { createdBy: req.user?._id || null, source: "dashboard" },
      });
    } else {
      Object.assign(customer, payload);
      customer.metadata = {
        ...(customer.metadata || {}),
        createdBy: customer.metadata?.createdBy || req.user?._id || null,
        source: customer.metadata?.source || "dashboard",
      };
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Quotation customer saved successfully",
      customer,
    });
  } catch (error) {
    console.error("Error saving quotation customer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save quotation customer",
      error: error.message,
    });
  }
};

export const getQuotationCustomerById = async (req, res) => {
  try {
    const customer = await QuotationCustomer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Quotation customer not found",
      });
    }

    return res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error("Error fetching quotation customer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation customer",
      error: error.message,
    });
  }
};

export const deleteQuotationCustomer = async (req, res) => {
  try {
    const customer = await QuotationCustomer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Quotation customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quotation customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quotation customer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete quotation customer",
      error: error.message,
    });
  }
};

export const getQuotations = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const quotations = await Quotation.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, quotations });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotations",
      error: error.message,
    });
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({ success: true, quotation });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation",
      error: error.message,
    });
  }
};

export const createQuotation = async (req, res) => {
  try {
    const normalized = await normalizeQuotationPayload(req.body, req.user);
    const prefix = normalized.company.invoicePrefix || "QTN";
    const quoteNumber = normalized.quoteNumber || (await buildQuoteNumber(prefix));

    if (!normalized.customer.customerName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (normalized.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one line item is required",
      });
    }

    let quotation = new Quotation({
      ...normalized,
      quoteNumber,
      metadata: {
        ...(normalized.metadata || {}),
        createdBy: req.user?._id || null,
        updatedBy: req.user?._id || null,
      },
    });

    await quotation.save();

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation,
    });
  } catch (error) {
    console.error("Error creating quotation:", error);
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Quotation number already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create quotation",
      error: error.message,
    });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    const normalized = await normalizeQuotationPayload(req.body, req.user);
    normalized.quoteNumber = quotation.quoteNumber;
    Object.assign(quotation, normalized);
    quotation.metadata = {
      ...(quotation.metadata || {}),
      updatedBy: req.user?._id || null,
    };

    await quotation.save();

    return res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      quotation,
    });
  } catch (error) {
    console.error("Error updating quotation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update quotation",
      error: error.message,
    });
  }
};

export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete quotation",
      error: error.message,
    });
  }
};
