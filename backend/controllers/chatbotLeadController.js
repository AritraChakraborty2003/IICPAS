import Lead from "../models/Lead.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhone = (value = "") => String(value).replace(/\D/g, "");

export const createChatbotLead = async (req, res) => {
  try {
    const {
      name = "",
      phone = "",
      email = "",
      source = "chatbot",
      sessionId = "",
      message = "Lead captured from chatbot pre-chat form",
    } = req.body || {};

    const trimmedName = name.trim();
    const normalizedPhone = normalizePhone(phone);
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a valid 10-digit number",
      });
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const lead = new Lead({
      name: trimmedName,
      phone: normalizedPhone,
      email: trimmedEmail || undefined,
      type: "chatbot",
      message: message || "Lead captured from chatbot pre-chat form",
      course: "",
    });

    await lead.save();

    return res.status(201).json({
      success: true,
      lead,
      metadata: {
        source: source || "chatbot",
        sessionId: sessionId || "",
      },
    });
  } catch (error) {
    console.error("Error creating chatbot lead:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
