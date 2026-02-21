import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";

const router = express.Router();

let razorpay = null;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn(
      "Razorpay not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
    );
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (err) {
  console.error("Razorpay init failed:", err.message);
}

const objectIdEquals = (left, right) => {
  if (!left || !right) return false;
  return left.toString() === right.toString();
};

const getCourseSessionAmount = (course, sessionType) => {
  if (!course) return 0;
  if (sessionType === "recorded") {
    return (
      course?.pricing?.recordedSession?.finalPrice ||
      course?.pricing?.recordedSession?.price ||
      course?.price ||
      0
    );
  }
  return (
    course?.pricing?.liveSession?.finalPrice ||
    course?.pricing?.liveSession?.price ||
    course?.price * (course?.pricing?.liveSession?.priceMultiplier || 1.5) ||
    0
  );
};

const buildRazorpayReceipt = (studentId) => {
  const timestamp = Date.now().toString();
  const studentSuffix = String(studentId || "student")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8);
  return `c_${timestamp}_${studentSuffix}`.slice(0, 40);
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

const sendReceiptForApprovedTransaction = async (transactionId) => {
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

const ensureRazorpayConfigured = (res) => {
  if (!razorpay) {
    res.status(500).json({
      success: false,
      message:
        "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    });
    return false;
  }
  return true;
};

router.post("/create-order", async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    // Backward compatibility for legacy generic order creation.
    if (!req.body?.courseId && Number(req.body?.value) > 0) {
      const legacyAmount = Number(req.body.value);
      const legacyAmountPaise = Math.round(legacyAmount * 100);
      const legacyCurrency = String(req.body.currency || "INR").trim().toUpperCase();
      const legacyReceipt = String(req.body.receipt || `legacy_${Date.now()}`).slice(
        0,
        40
      );

      if (!Number.isInteger(legacyAmountPaise) || legacyAmountPaise <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a valid positive value",
        });
      }

      if (!legacyCurrency) {
        return res.status(400).json({
          success: false,
          message: "Currency is required",
        });
      }

      if (legacyReceipt.length > 40) {
        return res.status(400).json({
          success: false,
          message: "Receipt must be 40 characters or fewer",
        });
      }

      const legacyOrder = await razorpay.orders.create({
        amount: legacyAmountPaise,
        currency: legacyCurrency,
        receipt: legacyReceipt,
      });

      return res.status(200).json({
        success: true,
        message: "Order created successfully",
        data: {
          orderId: legacyOrder.id,
          amount: legacyOrder.amount,
          currency: legacyOrder.currency,
          receipt: legacyOrder.receipt,
          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    const {
      courseId,
      sessionType,
      studentId,
      amount,
      currency = "INR",
      billingAddress = null,
      shippingAddress = null,
      sameAsBilling = true,
      quantity = 1,
    } = req.body;

    if (!courseId || !sessionType || !studentId) {
      return res.status(400).json({
        success: false,
        message: "courseId, sessionType and studentId are required",
      });
    }

    if (!["recorded", "live"].includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sessionType. Must be recorded or live.",
      });
    }

    const [student, course] = await Promise.all([
      Student.findById(studentId),
      Course.findById(courseId),
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const alreadyPurchased = student.course.some((id) =>
      objectIdEquals(id, courseId)
    );
    if (alreadyPurchased) {
      return res.status(409).json({
        success: false,
        message: "Course already purchased",
      });
    }

    const serverUnitAmount = getCourseSessionAmount(course, sessionType);
    const sanitizedQuantity = Math.max(1, parseInt(quantity, 10) || 1);
    const serverAmount = serverUnitAmount * sanitizedQuantity;

    const numericAmount = Number(amount) > 0 ? Number(amount) : serverAmount;
    const finalAmount = Math.max(serverAmount, numericAmount);

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount is required and must be greater than 0",
      });
    }

    const pendingExisting = await Transaction.findOne({
      studentId,
      courseId,
      sessionType,
      paymentMethod: "razorpay",
      status: "pending",
    }).sort({ createdAt: -1 });

    if (pendingExisting?.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Reusing pending order",
        data: {
          orderId: pendingExisting.razorpayOrderId,
          amount: Math.round(finalAmount * 100),
          currency,
          transactionId: pendingExisting._id,
          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    const amountInPaise = Math.round(finalAmount * 100);
    const normalizedCurrency = String(currency || "INR").trim().toUpperCase();
    const receipt = buildRazorpayReceipt(studentId);

    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive value",
      });
    }

    if (!normalizedCurrency) {
      return res.status(400).json({
        success: false,
        message: "Currency is required",
      });
    }

    if (receipt.length > 40) {
      return res.status(400).json({
        success: false,
        message: "Receipt must be 40 characters or fewer",
      });
    }

    console.info("Creating Razorpay order", {
      studentId: String(studentId),
      courseId: String(courseId),
      sessionType,
      amountInPaise,
      currency: normalizedCurrency,
      receiptLength: receipt.length,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: normalizedCurrency,
      receipt,
      notes: {
        studentId: studentId.toString(),
        courseId: courseId.toString(),
        sessionType,
      },
    });

    const transaction = new Transaction({
      studentId,
      courseId,
      sessionType,
      amount: finalAmount,
      paymentMethod: "razorpay",
      razorpayOrderId: order.id,
      billingAddress,
      shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
      sameAsBilling: Boolean(sameAsBilling),
      additionalNotes: "Razorpay checkout initiated",
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        transactionId: transaction._id,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const description = error?.error?.description || error?.description || "";
    const code = error?.error?.code || error?.code || "";
    const field = error?.error?.field || error?.field || "";
    const statusCode =
      Number.isInteger(error?.statusCode) && error.statusCode >= 400
        ? error.statusCode
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: description
        ? `Failed to create order: ${description}`
        : "Failed to create order",
      error: error.message,
      details: {
        ...(code ? { code } : {}),
        ...(field ? { field } : {}),
        ...(description ? { description } : {}),
      },
    });
  }
});

router.post("/verify-and-capture", async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !transactionId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId are required",
      });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (
      transaction.status === "approved" &&
      transaction.razorpayPaymentId === razorpay_payment_id
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: {
          transactionId: transaction._id,
          courseId: transaction.courseId,
          status: transaction.status,
        },
      });
    }

    if (
      transaction.razorpayOrderId &&
      transaction.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Order mismatch for transaction",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const providedBuffer = Buffer.from(razorpay_signature, "utf8");
    const isValidSignature =
      expectedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer);

    if (!isValidSignature) {
      transaction.status = "rejected";
      transaction.adminNotes = "Razorpay signature mismatch";
      transaction.razorpayPaymentId = razorpay_payment_id;
      transaction.razorpaySignature = razorpay_signature;
      await transaction.save();

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    transaction.status = "approved";
    transaction.razorpayOrderId = razorpay_order_id;
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.utrNumber = razorpay_payment_id;
    await transaction.save();

    await syncStudentEnrollment(transaction);

    let receiptStatus = { sent: false };
    try {
      receiptStatus = await sendReceiptForApprovedTransaction(transaction._id);
    } catch (receiptError) {
      console.error("Receipt send failed after payment verification:", receiptError);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and enrollment completed",
      data: {
        transactionId: transaction._id,
        courseId: transaction.courseId,
        studentId: transaction.studentId,
        status: transaction.status,
        receiptSent: Boolean(receiptStatus.sent),
      },
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
});

// Backward-compatible lightweight signature check endpoint
router.post("/verify-payment", async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Payment ID and Signature are required",
      });
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    const isValidSignature = expectedSignature === signature;

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId,
        paymentId,
        status: "verified",
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
});

router.get("/payment/:paymentId", async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;
    const { paymentId } = req.params;
    const payment = await razorpay.payments.fetch(paymentId);
    return res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
});

router.post("/refund", async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    const { paymentId, amount, notes } = req.body;
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const refund = await razorpay.payments.refund(paymentId, {
      payment_id: paymentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      notes: notes || { reason: "Customer requested refund" },
    });

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: refund,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: error.message,
    });
  }
});

export default router;
