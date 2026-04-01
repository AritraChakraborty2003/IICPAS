import express from "express";
import Transaction from "../models/Transaction.js";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";
import paymentScreenshotUpload from "../middleware/paymentScreenshotUpload.js";
import isStudent from "../middleware/isStudent.js";

const router = express.Router();

const objectIdEquals = (left, right) => {
  if (!left || !right) return false;
  return left.toString() === right.toString();
};

const syncStudentEnrollment = async (transaction) => {
  const student = await Student.findById(transaction.studentId);
  if (!student) return null;

  if (!student.course.some((id) => objectIdEquals(id, transaction.courseId))) {
    student.course.push(transaction.courseId);
  }

  if (transaction.sessionType === "recorded") {
    if (
      !student.enrolledRecordedSessions.some((id) =>
        objectIdEquals(id, transaction.courseId)
      )
    ) {
      student.enrolledRecordedSessions.push(transaction.courseId);
    }
  } else if (transaction.sessionType === "live") {
    if (
      !student.enrolledLiveSessions.some((id) =>
        objectIdEquals(id, transaction.courseId)
      )
    ) {
      student.enrolledLiveSessions.push(transaction.courseId);
    }
  }

  student.cart = student.cart.filter(
    (item) =>
      !(
        objectIdEquals(item.courseId, transaction.courseId) &&
        item.sessionType === transaction.sessionType
      )
  );

  await student.save();
  return student;
};

const sendReceiptForTransaction = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId)
    .populate("studentId", "name email")
    .populate("courseId", "title category price");

  if (!transaction || transaction.status !== "approved") {
    return { sent: false, reason: "Transaction missing or not approved" };
  }

  if (transaction.receiptSent) {
    return { sent: true, skipped: true };
  }

  const { generateReceiptPDF } = await import("../utils/pdfReceiptGenerator.js");
  const { sendReceiptEmail } = await import("../utils/emailService.js");

  const pdfBuffer = await generateReceiptPDF(transaction);
  await sendReceiptEmail(transaction, pdfBuffer);

  transaction.receiptSent = true;
  transaction.receiptSentAt = new Date();
  await transaction.save();

  return { sent: true, skipped: false };
};

// Get current student's invoice/transaction history
router.get("/student", isStudent, async (req, res) => {
  try {
    const studentId = req.user?.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [transactions, totalCount] = await Promise.all([
      Transaction.find({ studentId })
        .populate({
          path: "courseId",
          select: "title category price",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ studentId }),
    ]);

    return res.json({
      success: true,
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + transactions.length < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get student invoice history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice history",
      error: error.message,
    });
  }
});

// Submit payment with screenshot
router.post(
  "/submit-payment",
  paymentScreenshotUpload.single("paymentScreenshot"),
  async (req, res) => {
    try {
      const {
        courseId,
        sessionType,
        amount,
        utrNumber,
        additionalNotes,
        studentId,
      } = req.body;

      // Validate required fields
      if (!courseId || !sessionType || !amount || !utrNumber || !studentId) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: courseId, sessionType, amount, utrNumber, studentId",
        });
      }

      // Check if screenshot was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Payment screenshot is required",
        });
      }

      // Verify student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      // Verify course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      // Check if transaction already exists for this combination
      const existingTransaction = await Transaction.findOne({
        studentId,
        courseId,
        sessionType,
        status: { $in: ["pending", "approved"] },
      });

      if (existingTransaction) {
        return res.status(400).json({
          success: false,
          message: "Payment already submitted for this course and session type",
        });
      }

      // Create new transaction
      const transaction = new Transaction({
        studentId,
        courseId,
        sessionType,
        amount: parseFloat(amount),
        paymentMethod: "manual",
        utrNumber,
        paymentScreenshot: `/uploads/payment-screenshots/${req.file.filename}`,
        additionalNotes: additionalNotes || "",
      });

      await transaction.save();

      // Remove item from cart after successful payment submission
      student.cart = student.cart.filter(
        (item) =>
          !(item.courseId.toString() === courseId && item.sessionType === sessionType)
      );
      await student.save();

      res.status(201).json({
        success: true,
        message:
          "Payment submitted successfully. It will be reviewed by admin.",
        transaction: {
          id: transaction._id,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
      });
    } catch (error) {
      console.error("Submit payment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit payment",
        error: error.message,
      });
    }
  }
);

// Get all transactions (Admin only)
router.get("/admin/all", async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { utrNumber: { $regex: search, $options: "i" } },
          { additionalNotes: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Combine filter and search
    const query = { ...filter, ...searchQuery };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get transactions with populated data
    const transactions = await Transaction.find(query)
      .populate({
        path: "studentId",
        select: "name email phone",
      })
      .populate({
        path: "courseId",
        select: "title category price image",
      })
      .populate({
        path: "approvedBy",
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + transactions.length < totalCount,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
});

// Update transaction status (Admin only)
router.put("/admin/update-status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, adminNotes, adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID not provided",
      });
    }

    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be pending, approved, or rejected",
      });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Update transaction
    transaction.status = status;
    transaction.adminNotes = adminNotes || "";
    if (status === "approved") {
      transaction.approvedBy = adminId;
    }

    await transaction.save();

    // If approved, enroll student in the course and try receipt send
    if (status === "approved") {
      await syncStudentEnrollment(transaction);

      try {
        await sendReceiptForTransaction(transactionId);
      } catch (receiptError) {
        console.error(
          "Non-blocking receipt send failed for approved transaction:",
          receiptError
        );
      }
    }

    res.json({
      success: true,
      message: `Transaction ${status} successfully`,
      transaction,
    });
  } catch (error) {
    console.error("Update transaction status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update transaction status",
      error: error.message,
    });
  }
});

// Send receipt (Admin only)
router.post("/admin/send-receipt/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
      .populate("studentId", "name email")
      .populate("courseId", "title category price");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Can only send receipt for approved transactions",
      });
    }

    // Allow sending receipt multiple times - just update the timestamp
    if (transaction.receiptSent) {
      console.log(
        "Receipt previously sent. Sending again for transaction:",
        transactionId
      );
    }

    // Import utilities
    const { generateReceiptPDF } = await import(
      "../utils/pdfReceiptGenerator.js"
    );
    const { sendReceiptEmail } = await import("../utils/emailService.js");

    // Generate PDF receipt
    console.log("Generating PDF receipt for transaction:", transactionId);
    const pdfBuffer = await generateReceiptPDF(transaction);

    // Send email with PDF attachment
    console.log("Sending receipt email to:", transaction.studentId?.email);
    const emailResult = await sendReceiptEmail(transaction, pdfBuffer);

    // Update receipt sent status
    transaction.receiptSent = true;
    transaction.receiptSentAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: "Receipt sent successfully with PDF attachment",
      emailResult: {
        email: emailResult.email,
        messageId: emailResult.messageId,
      },
      transaction: {
        _id: transaction._id,
        receiptSent: true,
        receiptSentAt: transaction.receiptSentAt,
      },
    });
  } catch (error) {
    console.error("Send receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send receipt",
      error: error.message,
    });
  }
});

// Delete transaction (Admin only)
router.delete("/admin/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(transactionId);

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
      error: error.message,
    });
  }
});

// Get student's transactions
router.get("/student/my-transactions", async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const transactions = await Transaction.find({ studentId })
      .populate({
        path: "courseId",
        select: "title category price image",
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Get student transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
});

export default router;
