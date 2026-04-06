import QuizSoundSettings from "../models/QuizSoundSettings.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/quiz-sounds";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `quiz-sound-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"), false);
    }
  },
});

export const getQuizSoundSettings = async (req, res) => {
  try {
    const settings = await QuizSoundSettings.getSettings();
    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching quiz sound settings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateQuizSoundSettings = async (req, res) => {
  try {
    const { correctAnswerSound, wrongAnswerSound } = req.body;

    let settings = await QuizSoundSettings.findOne();
    if (!settings) {
      settings = new QuizSoundSettings();
    }

    if (correctAnswerSound !== undefined) {
      settings.correctAnswerSound = correctAnswerSound;
    }
    if (wrongAnswerSound !== undefined) {
      settings.wrongAnswerSound = wrongAnswerSound;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Quiz sound settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating quiz sound settings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const uploadQuizSound = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided",
      });
    }

    const soundUrl = `/uploads/quiz-sounds/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Sound uploaded successfully",
      soundUrl,
    });
  } catch (error) {
    console.error("Error uploading quiz sound:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { upload };
