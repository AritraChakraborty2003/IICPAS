import express from "express";
import WebsiteContact from "../../models/Website/Contact.js";
import ContactModel from "../../models/ContactModel.js";
import Message from "../../models/Message.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { isAdmin } from "../../middleware/isAdmin.js";
import {
  deleteMessage as deleteContactMessage,
  bulkDeleteMessages as bulkDeleteContactMessages,
} from "../../controllers/contactController.js";

const router = express.Router();

// Get current Contact content (public endpoint)
router.get("/", async (req, res) => {
  try {
    const contact = await WebsiteContact.findOne({ isActive: true }).sort({
      createdAt: -1,
    });
    if (!contact) {
      // Return default content if no content found
      return res.json({
        title: "Contact Us",
        subtitle: "Let's Get in Touch",
        description:
          "Ready to start your learning journey? Get in touch with us today!",
        contactInfo: {
          phone: {
            number: "+91 98765 43210",
            label: "Phone",
          },
          email: {
            address: "support@iicpa.org",
            label: "Email",
          },
          address: {
            text: "123 Knowledge Park, New Delhi, India",
            label: "Address",
          },
        },
        form: {
          buttonText: "Send Message",
          successMessage: "Message sent successfully!",
          errorMessage: "Something went wrong. Please try again.",
        },
        colors: {
          title: "text-green-600",
          subtitle: "text-gray-900",
          description: "text-gray-600",
          background: "bg-white",
        },
      });
    }
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Contact entries (admin only)
router.get("/all", requireAuth, isAdmin, async (req, res) => {
  try {
    const contacts = await WebsiteContact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit contact form (public endpoint)
router.post("/submit", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, and message are required" });
    }

    // Save to both Contact and Message models
    const newContact = new ContactModel({ name, email, phone, message });
    await newContact.save();

    const newMessage = new Message({ email, phone, message });
    await newMessage.save();

    console.log("Contact form submission:", { name, email, phone, message });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit contact form (public endpoint) - direct POST to /contact
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, and message are required" });
    }

    // Save to both Contact and Message models
    const newContact = new ContactModel({ name, email, phone, message });
    await newContact.save();

    const newMessage = new Message({ email, phone, message });
    await newMessage.save();

    console.log("Contact form submission:", { name, email, phone, message });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new Contact content (admin only)
router.post("/admin", requireAuth, isAdmin, async (req, res) => {
  try {
    // Deactivate all existing entries
    await WebsiteContact.updateMany({}, { isActive: false });

    // Create new entry
    const contact = await WebsiteContact.create(req.body);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Contact content (admin only)
router.put("/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const contact = await WebsiteContact.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact content not found" });
    }

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate Contact content (admin only)
router.put("/activate/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    // Deactivate all entries first
    await WebsiteContact.updateMany({}, { isActive: false });

    // Activate the selected entry
    const contact = await WebsiteContact.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact content not found" });
    }

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Contact content (admin only)
router.delete("/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const contact = await WebsiteContact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: "Contact content not found" });
    }

    res.json({ message: "Contact content deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Messages (Admin only)
router.get("/messages", requireAuth, isAdmin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Fetching messages failed:", error);
    res.status(500).json({ error: "Server error." });
  }
});

// Bulk delete messages (Admin only)
// Keep this before /messages/:id so "bulk-delete" is not treated as an id.
router.delete(
  "/messages/bulk-delete",
  requireAuth,
  isAdmin,
  bulkDeleteContactMessages
);

// Delete a single message (Admin only)
router.delete("/messages/:id", requireAuth, isAdmin, deleteContactMessage);

// Reply to Message (Admin only)
router.put("/messages/:id/reply", requireAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply, adminRepliedBy } = req.body;

    if (!adminReply) {
      return res.status(400).json({ error: "Reply message is required." });
    }

    const message = await Message.findByIdAndUpdate(
      id,
      {
        adminReply,
        adminRepliedBy: adminRepliedBy || req.user?.name || "Admin",
        adminRepliedAt: new Date(),
        status: "replied",
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Replying to message failed:", error);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
