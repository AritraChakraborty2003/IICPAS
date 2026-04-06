import express from "express";
import { sendBulkEmail, getAllEmailAddresses, testEmailConnection } from "../utils/emailService.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import EmailLog from "../models/EmailLog.js";

const router = express.Router();

// Get all email addresses (Super Admin only)
router.get("/emails", requireAuth, isAdmin, async (req, res) => {
  try {
    console.log("Fetching all email addresses for bulk email");
    const result = await getAllEmailAddresses();
    
    if (result.success) {
      res.json({
        success: true,
        message: "Email addresses fetched successfully",
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to fetch email addresses",
        error: result.error
      });
    }
  } catch (error) {
    console.error("Error in get emails route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Send bulk email (Super Admin only)
router.post("/send", requireAuth, isAdmin, async (req, res) => {
  try {
    const { subject, htmlContent, textContent, recipientTypes } = req.body;
    
    console.log("Bulk email request received:", {
      subject,
      recipientTypes,
      htmlContentLength: htmlContent?.length,
      textContentLength: textContent?.length
    });

    // Validate required fields
    if (!subject || (!htmlContent && !textContent)) {
      return res.status(400).json({
        success: false,
        message: "Subject and content (HTML or text) are required"
      });
    }

    // Get all email addresses
    const emailResult = await getAllEmailAddresses();
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch email addresses",
        error: emailResult.error
      });
    }

    // Filter recipients based on selected types
    let recipients = emailResult.emails;
    if (recipientTypes && recipientTypes.length > 0) {
      recipients = emailResult.emails.filter(email => 
        recipientTypes.includes(email.type)
      );
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No recipients found for the selected types"
      });
    }

    console.log(`Sending bulk email to ${recipients.length} recipients`);

    // Create email log entry
    const emailLog = new EmailLog({
      subject,
      htmlContent,
      textContent,
      recipientTypes,
      totalRecipients: recipients.length,
      sentBy: req.user.id,
      sentByName: req.user.name,
      sentByEmail: req.user.email,
      status: 'pending',
      isTestEmail: false
    });
    await emailLog.save();

    // Send bulk email with logging
    const result = await sendBulkEmail(recipients, subject, htmlContent, textContent, emailLog);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Bulk email sent successfully to ${result.successCount} recipients`,
        data: {
          totalRecipients: result.totalRecipients,
          successCount: result.successCount,
          failureCount: result.failureCount,
          results: result.results
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send bulk email",
        error: result.error
      });
    }
  } catch (error) {
    console.error("Error in send bulk email route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Test email connection (Super Admin only)
router.get("/test-connection", requireAuth, isAdmin, async (req, res) => {
  try {
    console.log("Testing email connection");
    const result = await testEmailConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: "Email connection test successful",
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Email connection test failed",
        error: result.error
      });
    }
  } catch (error) {
    console.error("Error in test email connection route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Send test email to admin (Super Admin only)
router.post("/test-send", requireAuth, isAdmin, async (req, res) => {
  try {
    const { subject, htmlContent, textContent } = req.body;
    const adminEmail = req.user.email; // Get admin email from authenticated user
    
    console.log("Sending test email to admin:", adminEmail);

    // Validate required fields
    if (!subject || (!htmlContent && !textContent)) {
      return res.status(400).json({
        success: false,
        message: "Subject and content (HTML or text) are required"
      });
    }

    // Create test email log entry
    const testEmailLog = new EmailLog({
      subject: `[TEST] ${subject}`,
      htmlContent,
      textContent,
      recipientTypes: ['Test'],
      totalRecipients: 1,
      sentBy: req.user.id,
      sentByName: req.user.name,
      sentByEmail: req.user.email,
      status: 'pending',
      isTestEmail: true
    });
    await testEmailLog.save();

    // Send test email to admin
    const result = await sendBulkEmail(
      [{ email: adminEmail, name: req.user.name || 'Admin', type: 'Test' }],
      `[TEST] ${subject}`,
      htmlContent,
      textContent,
      testEmailLog
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: "Test email sent successfully to admin",
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send test email",
        error: result.error
      });
    }
  } catch (error) {
    console.error("Error in send test email route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Get email logs (Super Admin only)
router.get("/logs", requireAuth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, isTestEmail } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (isTestEmail !== undefined) filter.isTestEmail = isTestEmail === 'true';

    const logs = await EmailLog.find(filter)
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmailLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Get specific email log details (Super Admin only)
router.get("/logs/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await EmailLog.findById(id).populate('sentBy', 'name email');
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Email log not found"
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error("Error fetching email log:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

export default router;
