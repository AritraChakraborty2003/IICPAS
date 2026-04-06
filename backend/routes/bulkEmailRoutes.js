import express from "express";
import nodemailer from "nodemailer";
import { emailConfig, isEmailConfigured, setupEmailInstructions } from "../config/emailConfig.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import EmailLog from "../models/EmailLog.js";
import Student from "../models/Students.js";
import Teacher from "../models/Teacher.js";
import College from "../models/College.js";
import Company from "../models/Company.js";
import Individual from "../models/Individual.js";
import NewsletterSubscription from "../models/NewsletterSubscription.js";

const router = express.Router();

const createTransporter = () => nodemailer.createTransport(emailConfig);

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const dedupeRecipients = (recipients) => {
  const seen = new Set();
  return recipients.filter((recipient) => {
    const key = normalizeEmail(recipient.email);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getAllEmailAddresses = async () => {
  const [students, teachers, colleges, companies, individuals, newsletter] =
    await Promise.all([
      Student.find({}, "name email phone").lean(),
      Teacher.find({}, "name email phone").lean(),
      College.find({}, "name email phone").lean(),
      Company.find({}, "fullName email phone").lean(),
      Individual.find({}, "name email phone").lean(),
      NewsletterSubscription.find({}, "name email phone").lean(),
    ]);

  const breakdown = {
    students: students.filter((item) => item.email).length,
    teachers: teachers.filter((item) => item.email).length,
    colleges: colleges.filter((item) => item.email).length,
    companies: companies.filter((item) => item.email).length,
    individuals: individuals.filter((item) => item.email).length,
    newsletter: newsletter.filter((item) => item.email).length,
  };

  const emails = dedupeRecipients([
    ...students
      .filter((item) => item.email)
      .map((item) => ({
        email: item.email,
        name: item.name || "Student",
        type: "Student",
      })),
    ...teachers
      .filter((item) => item.email)
      .map((item) => ({
        email: item.email,
        name: item.name || "Teacher",
        type: "Teacher",
      })),
    ...colleges
      .filter((item) => item.email)
      .map((item) => ({
        email: item.email,
        name: item.name || "College",
        type: "College",
      })),
    ...companies
      .filter((item) => item.email)
      .map((item) => ({
        email: item.email,
        name: item.fullName || item.name || "Company",
        type: "Company",
      })),
    ...individuals
      .filter((item) => item.email)
      .map((item) => ({
        email: item.email,
        name: item.name || "Individual",
        type: "Individual",
      })),
    ...newsletter
      .filter((item) => item.email)
      .map((item) => ({
        email: item.email,
        name: item.name || "Subscriber",
        type: "Newsletter",
      })),
  ]);

  return {
    success: true,
    emails,
    breakdown,
    totalEmails: emails.length,
  };
};

const sendEmail = async (to, subject, html, text = "") => {
  if (!isEmailConfigured()) {
    setupEmailInstructions();
    return {
      success: true,
      emailSent: false,
      email: to,
      messageId: `simulated-${Date.now()}`,
      message: "Email not configured - simulated send for development",
    };
  }

  const transporter = createTransporter();
  await transporter.verify();
  const info = await transporter.sendMail({
    from: {
      name: "IICPA Institute",
      address: emailConfig.auth.user,
    },
    to,
    subject,
    text,
    html,
  });

  return {
    success: true,
    emailSent: true,
    email: to,
    messageId: info.messageId,
  };
};

// Get all email addresses (admin only)
router.get("/emails", requireAuth, isAdmin, async (req, res) => {
  try {
    const result = await getAllEmailAddresses();
    return res.json({
      success: true,
      message: "Email addresses fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in get emails route:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Send bulk email (admin only)
router.post("/send", requireAuth, isAdmin, async (req, res) => {
  try {
    const { subject, htmlContent, textContent, recipientTypes = [] } = req.body;
    if (!subject || (!htmlContent && !textContent)) {
      return res.status(400).json({
        success: false,
        message: "Subject and content (HTML or text) are required",
      });
    }

    const emailResult = await getAllEmailAddresses();
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch email addresses",
      });
    }

    const recipients =
      recipientTypes.length > 0
        ? emailResult.emails.filter((entry) => recipientTypes.includes(entry.type))
        : emailResult.emails;

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No recipients found for the selected types",
      });
    }

    const emailLog = new EmailLog({
      subject,
      htmlContent,
      textContent,
      recipientTypes,
      totalRecipients: recipients.length,
      sentBy: req.user.id,
      sentByName: req.user.name,
      sentByEmail: req.user.email,
      status: "pending",
      isTestEmail: false,
    });
    await emailLog.save();

    const results = [];
    for (const recipient of recipients) {
      try {
        const sendResult = await sendEmail(
          recipient.email,
          subject,
          htmlContent,
          textContent || ""
        );
        results.push({ email: recipient.email, success: true, messageId: sendResult.messageId });
      } catch (error) {
        results.push({ email: recipient.email, success: false, error: error.message });
      }
    }

    const successCount = results.filter((item) => item.success).length;
    const failureCount = results.length - successCount;

    emailLog.status = failureCount === 0 ? "completed" : "failed";
    emailLog.successCount = successCount;
    emailLog.failureCount = failureCount;
    emailLog.results = results.map((item) => ({
      email: item.email,
      name: item.name || "",
      type: item.type || "",
      status: item.success ? "success" : "failed",
      messageId: item.messageId,
      error: item.error,
    }));
    emailLog.completedAt = new Date();
    await emailLog.save();

    return res.json({
      success: true,
      message: `Bulk email sent successfully to ${successCount} recipients`,
      data: {
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        results,
      },
    });
  } catch (error) {
    console.error("Error in send bulk email route:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Test email connection (admin only)
router.get("/test-connection", requireAuth, isAdmin, async (req, res) => {
  try {
    if (!isEmailConfigured()) {
      setupEmailInstructions();
      return res.json({
        success: true,
        message: "Email is not configured. Running in simulated mode.",
        data: { configured: false },
      });
    }

    const transporter = createTransporter();
    await transporter.verify();
    return res.json({
      success: true,
      message: "Email connection test successful",
      data: { configured: true },
    });
  } catch (error) {
    console.error("Error in test email connection route:", error);
    return res.status(500).json({
      success: false,
      message: "Email connection test failed",
      error: error.message,
    });
  }
});

// Send test email to admin
router.post("/test-send", requireAuth, isAdmin, async (req, res) => {
  try {
    const { subject, htmlContent, textContent } = req.body;
    const adminEmail = req.user.email;

    if (!subject || (!htmlContent && !textContent)) {
      return res.status(400).json({
        success: false,
        message: "Subject and content (HTML or text) are required",
      });
    }

    const testEmailLog = new EmailLog({
      subject: `[TEST] ${subject}`,
      htmlContent,
      textContent,
      recipientTypes: ["Test"],
      totalRecipients: 1,
      sentBy: req.user.id,
      sentByName: req.user.name,
      sentByEmail: req.user.email,
      status: "pending",
      isTestEmail: true,
    });
    await testEmailLog.save();

    const result = await sendEmail(
      adminEmail,
      `[TEST] ${subject}`,
      htmlContent,
      textContent || ""
    );

    testEmailLog.status = "completed";
    testEmailLog.successCount = 1;
    testEmailLog.failureCount = 0;
    testEmailLog.results = [
      {
        email: adminEmail,
        name: req.user.name || "Admin",
        type: "Test",
        status: "success",
        messageId: result.messageId,
      },
    ];
    testEmailLog.completedAt = new Date();
    await testEmailLog.save();

    return res.json({
      success: true,
      message: "Test email sent successfully to admin",
      data: result,
    });
  } catch (error) {
    console.error("Error in send test email route:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get email logs
router.get("/logs", requireAuth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, isTestEmail } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (isTestEmail !== undefined) filter.isTestEmail = isTestEmail === "true";

    const logs = await EmailLog.find(filter)
      .populate("sentBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmailLog.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
