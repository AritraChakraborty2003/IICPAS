// controllers/leadController.js
import Lead from "../models/Lead.js";

export const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      type,
      source,
      landingPageSessionId,
      landingPageUrl,
      landingPageTitle,
      course,
    } = req.body;
    const newLead = new Lead({
      name,
      email,
      phone,
      message,
      type,
      source,
      landingPageSessionId,
      landingPageUrl,
      landingPageTitle,
      course,
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
    const updateData = req.body;
    
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
