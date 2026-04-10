import express from "express";
import Transaction from "../models/Transaction.js";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";
import Admin from "../models/Admin.js";
import adminAuth from "../middleware/adminAuth.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Create a new transaction (for students)
router.post("/create", adminAuth, async (req, res) => {
  try {
    const { courseId, amount, utrNumber, notes } = req.body;
    const studentId = req.user.id;

    // Validate required fields
    if (!courseId || !amount || !utrNumber) {
      return res.status(400).json({
        success: false,
        message: "Course ID, amount, and UTR number are required",
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Create transaction
    const transaction = new Transaction({
      student: studentId,
      course: courseId,
      amount,
      utrNumber,
      notes: notes || "",
      status: "pending",
    });

    await transaction.save();

    // Populate the transaction with student and course details
    await transaction.populate([
      { path: "student", select: "name email" },
      { path: "course", select: "title slug" },
    ]);

    res.status(201).json({
      success: true,
      message:
        "Transaction created successfully. Payment verification is pending.",
      transaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get all transactions (admin only)
router.get("/all", adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { utrNumber: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get transactions with pagination
    const transactions = await Transaction.find(filter)
      .populate("student", "name email phone")
      .populate("course", "title slug price")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get transaction by ID
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const transaction = await Transaction.findById(id)
      .populate("student", "name email phone")
      .populate("course", "title slug price")
      .populate("verifiedBy", "name email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Check if user has permission to view this transaction
    if (userRole !== "Admin" && transaction.student._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Update transaction status (admin only)
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    // Validate status
    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be pending, verified, or rejected",
      });
    }

    const transaction = await Transaction.findById(id)
      .populate("student", "name email")
      .populate("course", "title");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Update transaction
    transaction.status = status;
    transaction.verifiedBy = adminId;
    transaction.verifiedAt = new Date();
    if (notes) {
      transaction.notes = notes;
    }

    await transaction.save();

    // Send email notification to student
    try {
      await sendPaymentNotificationEmail(transaction, status);
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: `Transaction ${status} successfully`,
      transaction,
    });
  } catch (error) {
    console.error("Error updating transaction status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get student's transactions
router.get("/student/my-transactions", adminAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ student: studentId })
      .populate("course", "title slug price")
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({ student: studentId });

    res.json({
      success: true,
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching student transactions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Email notification function
async function sendPaymentNotificationEmail(transaction, status) {
  try {
    // Create transporter (configure with your email service)
    const transporter = nodemailer.createTransport({
      service: "gmail", // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject, message;

    switch (status) {
      case "verified":
        subject = "Payment Verified - IICPA Institute";
        message = `
          Dear ${transaction.student.name},
          
          Your payment for the course "${transaction.course.title}" has been verified successfully.
          
          Transaction Details:
          - Amount: Rs. ${transaction.amount}
          - UTR Number: ${transaction.utrNumber}
          - Course: ${transaction.course.title}
          - Status: Verified
          
          You can now access your course materials.
          
          Thank you for choosing IICPA Institute!
        `;
        break;
      case "rejected":
        subject = "Payment Verification Failed - IICPA Institute";
        message = `
          Dear ${transaction.student.name},
          
          Unfortunately, your payment for the course "${transaction.course.title}" could not be verified.
          
          Transaction Details:
          - Amount: Rs. ${transaction.amount}
          - UTR Number: ${transaction.utrNumber}
          - Course: ${transaction.course.title}
          - Status: Rejected
          
          Please contact our support team for assistance.
          
          Thank you for choosing IICPA Institute!
        `;
        break;
      default:
        return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: transaction.student.email,
      subject,
      text: message,
    });

    console.log(
      `Payment notification email sent to ${transaction.student.email}`
    );
  } catch (error) {
    console.error("Error sending payment notification email:", error);
    throw error;
  }
}

export default router;
