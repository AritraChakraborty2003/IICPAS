import ChatbotSettings from "../models/ChatbotSettings.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/chatbot";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "chatbot-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Get chatbot settings
export const getChatbotSettings = async (req, res) => {
  try {
    const settings = await ChatbotSettings.getSettings();
    
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Error fetching chatbot settings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update chatbot settings
export const updateChatbotSettings = async (req, res) => {
  try {
    const { assistantName, welcomeMessage, status, welcomeQuickReplies, responses, defaultResponse } = req.body;

    let settings = await ChatbotSettings.findOne();

    if (!settings) {
      settings = new ChatbotSettings();
    }

    // Update fields
    if (assistantName !== undefined) settings.assistantName = assistantName;
    if (welcomeMessage !== undefined) settings.welcomeMessage = welcomeMessage;
    if (status !== undefined) settings.status = status;
    if (welcomeQuickReplies !== undefined) settings.welcomeQuickReplies = welcomeQuickReplies;
    if (responses !== undefined) settings.responses = responses;
    if (defaultResponse !== undefined) settings.defaultResponse = defaultResponse;

    await settings.save();
    
    res.status(200).json({
      success: true,
      message: "Chatbot settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating chatbot settings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Upload chatbot profile picture
export const uploadChatbotImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }
    
    const imageUrl = `/uploads/chatbot/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl
    });
  } catch (error) {
    console.error("Error uploading chatbot image:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Export multer middleware for use in routes
export { upload };

