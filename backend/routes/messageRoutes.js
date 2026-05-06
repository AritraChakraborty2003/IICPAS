import express from "express";
import {
  createMessage,
  getAllMessages,
  getMessagesByEmail,
  getMessageById,
  bulkDeleteMessages,
  deleteMessage,
  adminReplyToMessage,
} from "../controllers/messageControllers.js";

const router = express.Router();

// Create a new message
router.post("/", createMessage);

// Get all messages (for admin purposes)
router.get("/all", getAllMessages);

// Get messages by email
router.get("/by-email/:email", getMessagesByEmail);

// Admin reply to message (must come before /:id route)
router.put("/admin-reply/:id", adminReplyToMessage);
router.delete("/bulk-delete", bulkDeleteMessages);

// Get message by ID
router.get("/:id", getMessageById);

// Delete message by ID
router.delete("/:id", deleteMessage);

export default router;
