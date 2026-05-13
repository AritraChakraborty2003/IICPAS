// controllers/leadController.js
import Lead from "../models/Lead.js";

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : value;

const isMeaningfulValue = (value) =>
  value !== undefined && value !== null && value !== "";

const buildLeadUpdateData = (payload = {}) =>
  Object.entries(payload).reduce((acc, [key, value]) => {
    if (!isMeaningfulValue(value)) return acc;
    acc[key] = normalizeText(value);
    return acc;
  }, {});

export const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      whatsappNumber,
      company,
      message,
      type,
      source,
      landingPageSessionId,
      landingPageUrl,
      landingPageTitle,
      course,
    } = req.body;
    const newLead = new Lead({
      name: normalizeText(name) || normalizeText(phone) || "Lead",
      email: normalizeText(email),
      phone: normalizeText(phone),
      whatsappNumber: normalizeText(whatsappNumber),
      company: normalizeText(company),
      message: normalizeText(message),
      type: normalizeText(type),
      source: normalizeText(source),
      landingPageSessionId: normalizeText(landingPageSessionId),
      landingPageUrl: normalizeText(landingPageUrl),
      landingPageTitle: normalizeText(landingPageTitle),
      course: normalizeText(course),
    });
    await newLead.save();
    res.status(201).json({ success: true, lead: newLead });
  } catch (err) {
    console.error("Error creating lead:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, leads });
  } catch (err) {
    console.error("Error fetching leads:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = buildLeadUpdateData(req.body);
    
    const lead = await Lead.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }
    
    res.status(200).json({ success: true, lead });
  } catch (err) {
    console.error("Error updating lead:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await Lead.findByIdAndDelete(id);
    
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }
    
    res.status(200).json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    console.error("Error deleting lead:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
