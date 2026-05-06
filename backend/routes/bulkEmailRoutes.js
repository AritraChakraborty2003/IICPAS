import express from "express";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import {
  emailConfig,
  isEmailConfigured,
  setupEmailInstructions,
} from "../config/emailConfig.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import EmailLog from "../models/EmailLog.js";
import Student from "../models/Students.js";
import Teacher from "../models/Teacher.js";
import College from "../models/College.js";
import Company from "../models/Company.js";
import Individual from "../models/Individual.js";
import NewsletterSubscription from "../models/NewsletterSubscription.js";
import BulkEmailSenderAccount from "../models/BulkEmailSenderAccount.js";
import { decryptSecret, encryptSecret } from "../utils/secureVault.js";

const router = express.Router();

const createTransporter = (auth) =>
  nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_SECURE || "false") === "true",
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth,
  });

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

const getSenderAccounts = async () =>
  BulkEmailSenderAccount.find({})
    .select("label email createdAt lastUsedAt createdBy")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

const sanitizeSenderAccount = (account) => ({
  _id: account._id,
  label: account.label || "",
  email: account.email,
  createdAt: account.createdAt,
  lastUsedAt: account.lastUsedAt || null,
  createdBy: account.createdBy
    ? {
        _id: account.createdBy._id,
        name: account.createdBy.name,
        email: account.createdBy.email,
      }
    : null,
});

const buildStudentRecipients = async (selectedStudentIds = []) => {
  const incomingIds = Array.isArray(selectedStudentIds) ? selectedStudentIds : [];
  const uniqueIds = [...new Set(incomingIds.map((value) => String(value)))].filter(Boolean);

  if (uniqueIds.length === 0) {
    return { error: "Please select at least one student", status: 400 };
  }

  if (uniqueIds.length > 10) {
    return {
      error: "You can send bulk email to a maximum of 10 students at a time",
      status: 400,
    };
  }

  const invalidIds = uniqueIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return { error: "One or more student IDs are invalid", status: 400 };
  }

  const students = await Student.find({ _id: { $in: uniqueIds } })
    .select("name email")
    .lean();

  if (students.length !== uniqueIds.length) {
    return {
      error: "One or more selected students could not be found",
      status: 400,
    };
  }

  const studentMap = new Map(students.map((student) => [String(student._id), student]));
  const recipients = uniqueIds
    .map((id) => studentMap.get(id))
    .filter((student) => student && student.email);

  if (recipients.length !== uniqueIds.length) {
    return {
      error: "All selected students must have a valid email address",
      status: 400,
    };
  }

  return { recipients, uniqueIds };
};

const applyRecipientVariables = (template, recipient) => {
  const name = recipient?.name || "Student";
  const email = recipient?.email || "";
  return String(template || "")
    .replace(/\{\{studentName\}\}/g, name)
    .replace(/\{\{studentEmail\}\}/g, email)
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{email\}\}/g, email);
};

const stripHtml = (html) =>
  String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const sendEmail = async ({ senderAccount, to, subject, html, text }) => {
  const transporter = createTransporter({
    user: senderAccount.email,
    pass: decryptSecret(senderAccount.encryptedAppPassword),
  });

  const info = await transporter.sendMail({
    from: {
      name: senderAccount.label || "IICPA Institute",
      address: senderAccount.email,
    },
    replyTo: senderAccount.email,
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

// Sender accounts (admin only)
router.get("/sender-accounts", requireAuth, isAdmin, async (req, res) => {
  try {
    const senderAccounts = await getSenderAccounts();
    return res.json({
      success: true,
      data: senderAccounts.map(sanitizeSenderAccount),
    });
  } catch (error) {
    console.error("Error fetching sender accounts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sender accounts",
      error: error.message,
    });
  }
});

router.post("/sender-accounts", requireAuth, isAdmin, async (req, res) => {
  try {
    const { label = "", email, appPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !appPassword) {
      return res.status(400).json({
        success: false,
        message: "Sender email and app password are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid sender email address",
      });
    }

    const existing = await BulkEmailSenderAccount.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A sender account with this email already exists",
      });
    }

    const transporter = createTransporter({
      user: normalizedEmail,
      pass: String(appPassword || "").trim(),
    });

    await transporter.verify();

    const senderAccount = await BulkEmailSenderAccount.create({
      label: String(label || "").trim(),
      email: normalizedEmail,
      encryptedAppPassword: encryptSecret(String(appPassword || "").trim()),
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Sender account saved successfully",
      data: sanitizeSenderAccount({
        ...senderAccount.toObject(),
        createdBy: {
          _id: req.user.id,
          name: req.user.name,
          email: req.user.email,
        },
      }),
    });
  } catch (error) {
    console.error("Error saving sender account:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save sender account",
      error: error.message,
    });
  }
});

router.delete("/sender-accounts/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender account ID",
      });
    }

    const deleted = await BulkEmailSenderAccount.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Sender account not found",
      });
    }

    return res.json({
      success: true,
      message: "Sender account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sender account:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete sender account",
      error: error.message,
    });
  }
});

// Send bulk email to selected students (admin only)
router.post("/send", requireAuth, isAdmin, async (req, res) => {
  try {
    const {
      subject,
      htmlContent,
      textContent,
      selectedStudentIds = [],
      senderAccountId,
    } = req.body;

    if (!subject || (!htmlContent && !textContent)) {
      return res.status(400).json({
        success: false,
        message: "Subject and content (HTML or text) are required",
      });
    }

    if (!senderAccountId) {
      return res.status(400).json({
        success: false,
        message: "Please select a sender email account",
      });
    }

    const senderAccount = await BulkEmailSenderAccount.findById(senderAccountId).select(
      "+encryptedAppPassword"
    );
    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: "Selected sender account was not found",
      });
    }

    const recipientBuild = await buildStudentRecipients(selectedStudentIds);
    if (recipientBuild.error) {
      return res.status(recipientBuild.status || 400).json({
        success: false,
        message: recipientBuild.error,
      });
    }

    const recipients = recipientBuild.recipients;
    const finalTextContent = String(textContent || "").trim() || stripHtml(htmlContent);

    const emailLog = new EmailLog({
      subject,
      htmlContent,
      textContent: finalTextContent,
      recipientTypes: ["Student"],
      totalRecipients: recipients.length,
      sentBy: req.user.id,
      sentByName: req.user.name || req.user.fullName || "Admin",
      sentByEmail: req.user.email || "admin@iicpa.in",
      senderAccountId: senderAccount._id,
      senderAccountEmail: senderAccount.email,
      senderAccountLabel: senderAccount.label || senderAccount.email,
      status: "sending",
      isTestEmail: false,
      results: [],
    });
    await emailLog.save();

    const results = [];
    const batchSize = 10;

    for (let index = 0; index < recipients.length; index += batchSize) {
      const batch = recipients.slice(index, index + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (recipient) => {
          const personalizedHtml = applyRecipientVariables(htmlContent, recipient);
          const personalizedText = applyRecipientVariables(finalTextContent, recipient);

          try {
            const sendResult = await sendEmail({
              senderAccount,
              to: recipient.email,
              subject,
              html: personalizedHtml,
              text: personalizedText,
            });
            return {
              email: recipient.email,
              name: recipient.name,
              type: "Student",
              success: true,
              messageId: sendResult.messageId,
            };
          } catch (error) {
            return {
              email: recipient.email,
              name: recipient.name,
              type: "Student",
              success: false,
              error: error.message,
            };
          }
        })
      );

      results.push(...batchResults);
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

    senderAccount.lastUsedAt = new Date();
    await senderAccount.save();

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

    const transporter = createTransporter(emailConfig.auth);
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

// Send test email to admin using a saved sender account
router.post("/test-send", requireAuth, isAdmin, async (req, res) => {
  try {
    const { subject, htmlContent, textContent, senderAccountId } = req.body;
    const adminEmail = req.user.email;

    if (!subject || (!htmlContent && !textContent)) {
      return res.status(400).json({
        success: false,
        message: "Subject and content (HTML or text) are required",
      });
    }

    if (!senderAccountId) {
      return res.status(400).json({
        success: false,
        message: "Please select a sender email account",
      });
    }

    const senderAccount = await BulkEmailSenderAccount.findById(senderAccountId).select(
      "+encryptedAppPassword"
    );
    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: "Selected sender account was not found",
      });
    }

    const finalTextContent = String(textContent || "").trim() || stripHtml(htmlContent);

    const testEmailLog = new EmailLog({
      subject: `[TEST] ${subject}`,
      htmlContent,
      textContent: finalTextContent,
      recipientTypes: ["Test"],
      totalRecipients: 1,
      sentBy: req.user.id,
      sentByName: req.user.name || req.user.fullName || "Admin",
      sentByEmail: req.user.email || "admin@iicpa.in",
      senderAccountId: senderAccount._id,
      senderAccountEmail: senderAccount.email,
      senderAccountLabel: senderAccount.label || senderAccount.email,
      status: "pending",
      isTestEmail: true,
    });
    await testEmailLog.save();

    const result = await sendEmail({
      senderAccount,
      to: adminEmail,
      subject: `[TEST] ${subject}`,
      html: htmlContent,
      text: finalTextContent,
    });

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
