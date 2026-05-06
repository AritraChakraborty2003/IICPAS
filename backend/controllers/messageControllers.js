import Message from "../models/Message.js";

// Create a new message
export const createMessage = async (req, res) => {
  try {
    const { email, phone, message } = req.body;

    if (!email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "Email, phone, and message are required",
      });
    }

    const newMessage = await Message.create({
      email,
      phone,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Get all messages (for admin purposes)
export const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// Get messages by email
export const getMessagesByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const messages = await Message.find({ email }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages by email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// Bulk delete messages by IDs
export const bulkDeleteMessages = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message IDs are required",
      });
    }

    const result = await Message.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: "Messages deleted successfully",
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Error bulk deleting messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete messages",
      error: error.message,
    });
  }
};

// Get message by ID
export const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Message ID is required",
      });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error fetching message by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message",
      error: error.message,
    });
  }
};

// Delete message by ID
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Message ID is required",
      });
    }

    const message = await Message.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

// Admin reply to message
export const adminReplyToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply, adminRepliedBy } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Message ID is required",
      });
    }

    if (!adminReply || !adminRepliedBy) {
      return res.status(400).json({
        success: false,
        message: "Admin reply and admin name are required",
      });
    }

    const message = await Message.findByIdAndUpdate(
      id,
      {
        adminReply,
        adminRepliedBy,
        adminRepliedAt: new Date(),
        status: "replied",
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin reply sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error sending admin reply:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send admin reply",
      error: error.message,
    });
  }
};
