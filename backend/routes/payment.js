import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";
import Coupon from "../models/Coupon.js";
import Booking from "../models/Booking.js";
import CourseBooking from "../models/CourseBooking.js";
import LiveSession from "../models/LiveSession/LiveSession.js";
import { awardCoins, getCoinSettings } from "../services/coinService.js";
import { generateLiveSessionReceiptPDF } from "../utils/pdfLiveSessionReceiptGenerator.js";
import { sendLiveSessionReceiptEmail } from "../utils/liveSessionEmailService.js";

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

const toPaise = (amount) => Math.max(0, Math.round(Number(amount || 0) * 100));
const fromPaise = (amountPaise) => Number((amountPaise / 100).toFixed(2));
const activeCourseBookingStatuses = ["prebooked", "partially_paid", "fully_paid"];
const parseTransactionNotes = (value) => {
  if (!value || typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
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

  let pdfBuffer = null;
  try {
    pdfBuffer = await generateReceiptPDF(transaction);
  } catch (pdfError) {
    console.error(
      `PDF generation failed for transaction ${transaction._id}. Sending email without attachment:`,
      pdfError.message
    );
  }
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

const LEGACY_BOOKING_PAYMENT_PURPOSE = "legacy_training_booking";
const LIVE_SESSION_PAYMENT_PURPOSE = "live_session_enrollment";
const LEGACY_BOOKING_CATEGORIES = ["recorded", "live", "onsite"];
const LEGACY_BOOKING_TYPES = ["company", "individual", "college"];

const isLegacyBookingOrderPayload = (body) =>
  Boolean(body?.email && body?.trainingTitle && body?.category) &&
  Number(body?.price) > 0 &&
  Number(body?.hrs) > 0;

const normalizeLegacyBookingType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return LEGACY_BOOKING_TYPES.includes(normalized) ? normalized : "individual";
};

const isLiveSessionOrderPayload = (body) =>
  Boolean(body?.liveSessionId && body?.email && body?.name) &&
  Number(body?.price) > 0;

const normalizeLegacyBookingReceipt = (booking) => {
  if (!booking) return null;
  return {
    bookingId: booking._id,
    for: booking.title,
    amount: booking.paymentAmount || 0,
    paymentMethod: booking.paymentMethod || "manual",
    razorpay_order_id: booking.razorpayOrderId || "",
    razorpay_payment_id: booking.razorpayPaymentId || "",
    paidAt: booking.paymentVerifiedAt || booking.updatedAt || booking.createdAt,
    receiptLink: null,
  };
};

const normalizeLiveSessionReceipt = (booking) => {
  if (!booking) return null;
  return {
    bookingId: booking._id,
    liveSessionId: booking.liveSessionId || null,
    title: booking.title,
    amount: booking.paymentAmount || 0,
    paymentMethod: booking.paymentMethod || "manual",
    paymentStatus: booking.paymentStatus || "pending",
    razorpay_order_id: booking.razorpayOrderId || "",
    razorpay_payment_id: booking.razorpayPaymentId || "",
    paidAt: booking.paymentVerifiedAt || booking.updatedAt || booking.createdAt,
    email: booking.by || "",
    phone: booking.phone || "",
    whatsappNumber: booking.whatsappNumber || booking.phone || "",
  };
};

const sendReceiptForLiveSessionBooking = async (bookingId) => {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking || booking.paymentStatus !== "paid") {
    return { sent: false, reason: "Booking missing or not paid" };
  }

  if (booking.receiptSent) {
    return { sent: true, skipped: true };
  }

  const pdfBuffer = await generateLiveSessionReceiptPDF(booking);
  await sendLiveSessionReceiptEmail(booking, pdfBuffer);

  await Booking.findByIdAndUpdate(bookingId, {
    receiptSent: true,
    receiptSentAt: new Date(),
  });

  return { sent: true, skipped: false };
};

const verifyRazorpaySignature = ({
  orderId,
  paymentId,
  signature,
  secret,
}) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");
  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
};

const createLegacyBookingFromOrder = async ({
  order,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const existingBooking = await Booking.findOne({
    $or: [
      ...(razorpay_payment_id ? [{ razorpayPaymentId: razorpay_payment_id }] : []),
      ...(razorpay_order_id ? [{ razorpayOrderId: razorpay_order_id }] : []),
    ],
  }).sort({ createdAt: -1 });

  if (existingBooking) {
    let changed = false;
    if (!existingBooking.razorpayPaymentId && razorpay_payment_id) {
      existingBooking.razorpayPaymentId = razorpay_payment_id;
      changed = true;
    }
    if (!existingBooking.razorpaySignature && razorpay_signature) {
      existingBooking.razorpaySignature = razorpay_signature;
      changed = true;
    }
    if (!existingBooking.paymentVerifiedAt) {
      existingBooking.paymentVerifiedAt = new Date();
      changed = true;
    }
    if (changed) await existingBooking.save();
    return { booking: existingBooking, alreadyExists: true };
  }

  const notes = order?.notes || {};
  const amount = fromPaise(Number(order?.amount || 0));

  const booking = await Booking.create({
    by: String(notes.email || "").trim().toLowerCase(),
    requesterName: String(notes.name || "").trim(),
    title: String(notes.trainingTitle || "").trim(),
    hrs: Math.max(1, parseInt(notes.hrs, 10) || 1),
    type: normalizeLegacyBookingType(notes.bookingType || notes.type),
    category: LEGACY_BOOKING_CATEGORIES.includes(
      String(notes.category || "").trim().toLowerCase()
    )
      ? String(notes.category).trim().toLowerCase()
      : "onsite",
    status: "pending",
    paymentMethod: "razorpay",
    paymentAmount: amount,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    paymentVerifiedAt: new Date(),
    paymentSource: String(notes.paymentSource || "dashboard").trim(),
  });

  return { booking, alreadyExists: false };
};

const createLiveSessionBookingFromOrder = async ({
  order,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const notes = order?.notes || {};
  const liveSessionId = String(notes.liveSessionId || "").trim();
  const email = String(notes.email || "").trim().toLowerCase();
  const studentId = String(notes.studentId || "").trim();
  const linkedStudent =
    studentId && mongoose.Types.ObjectId.isValid(studentId)
      ? await Student.findById(studentId).select("_id name email phone")
      : email
      ? await Student.findOne({ email }).select("_id name email phone")
      : null;

  const existingBooking = await Booking.findOne({
    $or: [
      ...(razorpay_payment_id ? [{ razorpayPaymentId: razorpay_payment_id }] : []),
      ...(razorpay_order_id ? [{ razorpayOrderId: razorpay_order_id }] : []),
      ...(liveSessionId && email
        ? [
            {
              liveSessionId,
              by: email,
              paymentStatus: "paid",
            },
          ]
        : []),
    ],
  }).sort({ createdAt: -1 });

  if (existingBooking) {
    let changed = false;
    if (!existingBooking.studentId && linkedStudent?._id) {
      existingBooking.studentId = linkedStudent._id;
      changed = true;
    }
    if (!existingBooking.razorpayPaymentId && razorpay_payment_id) {
      existingBooking.razorpayPaymentId = razorpay_payment_id;
      changed = true;
    }
    if (!existingBooking.razorpaySignature && razorpay_signature) {
      existingBooking.razorpaySignature = razorpay_signature;
      changed = true;
    }
    if (!existingBooking.paymentVerifiedAt) {
      existingBooking.paymentVerifiedAt = new Date();
      changed = true;
    }
    if (existingBooking.paymentStatus !== "paid") {
      existingBooking.paymentStatus = "paid";
      changed = true;
    }
    if (existingBooking.status !== "booked") {
      existingBooking.status = "booked";
      changed = true;
    }
    if (changed) await existingBooking.save();
    return { booking: existingBooking, alreadyExists: true };
  }

  const liveSession = await LiveSession.findById(liveSessionId).lean();
  if (!liveSession) {
    throw new Error("Live session not found while creating booking");
  }

  const amount = fromPaise(Number(order?.amount || 0));
  const booking = await Booking.create({
    studentId: linkedStudent?._id || null,
    liveSessionId,
    by: email,
    requesterName: String(notes.name || "").trim(),
    phone: String(notes.phone || "").trim(),
    whatsappNumber: String(notes.whatsappNumber || notes.phone || "").trim(),
    title: String(notes.sessionTitle || liveSession.title || "").trim(),
    hrs: Math.max(1, Math.ceil(Number(liveSession.duration || 60) / 60)),
    type: "individual",
    category: "live",
    status: "booked",
    date: liveSession.date,
    paymentMethod: "razorpay",
    paymentAmount: amount,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    paymentVerifiedAt: new Date(),
    paymentStatus: "paid",
    paymentSource: String(notes.paymentSource || "live-session-page").trim(),
  });

  if (linkedStudent) {
    await Student.updateOne(
      { _id: linkedStudent._id },
      { $addToSet: { enrolledLiveSessions: liveSessionId } }
    );
  }

  return { booking, alreadyExists: false };
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

    if (isLegacyBookingOrderPayload(req.body)) {
      const email = String(req.body.email || "").trim().toLowerCase();
      const name = String(req.body.name || "").trim();
      const trainingTitle = String(req.body.trainingTitle || "").trim();
      const category = String(req.body.category || "")
        .trim()
        .toLowerCase();
      const hrs = Math.max(1, parseInt(req.body.hrs, 10) || 0);
      const amountValue = Number(req.body.price);
      const bookingType = normalizeLegacyBookingType(
        req.body.bookingType || req.body.type
      );
      const paymentSource = String(
        req.body.paymentSource || req.body.source || "dashboard"
      ).trim();
      const normalizedCurrency = String(req.body.currency || "INR")
        .trim()
        .toUpperCase();
      const amountInPaise = Math.round(amountValue * 100);
      const receipt = String(
        req.body.receipt || `booking_${Date.now()}_${bookingType}`
      ).slice(0, 40);

      if (!email || !trainingTitle || !hrs) {
        return res.status(400).json({
          success: false,
          message: "email, trainingTitle, category, hrs, and price are required",
        });
      }

      if (!LEGACY_BOOKING_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking category",
        });
      }

      if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a valid positive value",
        });
      }

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: normalizedCurrency,
        receipt,
        notes: {
          paymentPurpose: LEGACY_BOOKING_PAYMENT_PURPOSE,
          email,
          name,
          trainingTitle,
          category,
          hrs: String(hrs),
          bookingType,
          paymentSource,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Booking payment order created successfully",
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          key: process.env.RAZORPAY_KEY_ID,
          bookingRequest: {
            email,
            name,
            trainingTitle,
            category,
            hrs,
            bookingType,
          },
        },
      });
    }

    if (isLiveSessionOrderPayload(req.body)) {
      const liveSessionId = String(req.body.liveSessionId || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const name = String(req.body.name || "").trim();
      const phone = String(req.body.phone || "").trim();
      const studentId = String(req.body.studentId || "").trim();
      const whatsappNumber = String(
        req.body.whatsappNumber || req.body.phone || ""
      ).trim();
      const paymentSource = String(
        req.body.paymentSource || "live-session-page"
      ).trim();
      const amountValue = Number(req.body.price);

      if (!liveSessionId || !email || !name || !phone) {
        return res.status(400).json({
          success: false,
          message: "liveSessionId, name, email, phone, and price are required",
        });
      }

      const liveSession = await LiveSession.findById(liveSessionId).lean();
      if (!liveSession) {
        return res.status(404).json({
          success: false,
          message: "Live session not found",
        });
      }

      const existingPaidBooking = await Booking.findOne({
        liveSessionId,
        by: email,
        paymentStatus: "paid",
      }).lean();

      if (existingPaidBooking) {
        return res.status(409).json({
          success: false,
          message: "This email is already booked for the selected live session",
          data: {
            bookingId: existingPaidBooking._id,
          },
        });
      }

      const amountInPaise = Math.round(amountValue * 100);
      if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a valid positive value",
        });
      }

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: String(`ls_${Date.now()}_${liveSessionId}`).slice(0, 40),
        notes: {
          paymentPurpose: LIVE_SESSION_PAYMENT_PURPOSE,
          liveSessionId,
          email,
          name,
          phone,
          studentId,
          whatsappNumber,
          sessionTitle: String(liveSession.title || "").trim(),
          paymentSource,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Live session payment order created successfully",
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          key: process.env.RAZORPAY_KEY_ID,
          bookingPreview: {
            liveSessionId,
            sessionTitle: liveSession.title,
            sessionDate: liveSession.date,
            amount: amountValue,
          },
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
      cartItems = [],
      appliedCouponCode = "",
    } = req.body;

    const isCartMode = Array.isArray(cartItems) && cartItems.length > 0;

    if (isCartMode) {
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "studentId is required",
        });
      }

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      const normalizedCartItems = cartItems
        .map((item) => ({
          courseId: item?.courseId,
          sessionType: item?.sessionType,
          quantity: Math.max(1, parseInt(item?.quantity, 10) || 1),
        }))
        .filter((item) => item.courseId && ["recorded", "live"].includes(item.sessionType));

      if (!normalizedCartItems.length) {
        return res.status(400).json({
          success: false,
          message: "cartItems must include valid courseId, sessionType, and quantity",
        });
      }

      const uniqueCourseIds = [...new Set(normalizedCartItems.map((item) => String(item.courseId)))];
      const courses = await Course.find({ _id: { $in: uniqueCourseIds } });
      const courseMap = new Map(courses.map((course) => [String(course._id), course]));
      const existingCourseBookings = await CourseBooking.find({
        studentId,
        itemType: "single_course",
        status: { $in: activeCourseBookingStatuses },
        paymentStatus: { $ne: "failed" },
        remainingAmount: { $gt: 0 },
        courseId: { $in: uniqueCourseIds },
      }).select("courseId sessionType remainingAmount");
      const existingBookingMap = new Map(
        existingCourseBookings.map((booking) => [
          `${String(booking.courseId)}:${booking.sessionType || "recorded"}`,
          booking,
        ])
      );

      const resolvedItems = [];
      for (const item of normalizedCartItems) {
        const course = courseMap.get(String(item.courseId));
        if (!course) {
          return res.status(404).json({
            success: false,
            message: `Course not found for id ${item.courseId}`,
          });
        }

        const alreadyPurchased = student.course.some((id) =>
          objectIdEquals(id, item.courseId)
        );
        if (alreadyPurchased) {
          return res.status(409).json({
            success: false,
            message: `${course.title} is already purchased`,
          });
        }

        const bookingKey = `${String(item.courseId)}:${item.sessionType}`;
        const existingBooking = existingBookingMap.get(bookingKey);
        if (existingBooking) {
          return res.status(409).json({
            success: false,
            code: "BOOKING_BALANCE_PENDING",
            message:
              "This course already has an active booking. Please go to your dashboard, open the Bookings page, and make the remaining balance payment. Purchase is not allowed from checkout.",
            data: {
              courseId: item.courseId,
              sessionType: item.sessionType,
              remainingAmount: Number(existingBooking.remainingAmount || 0),
            },
          });
        }

        const unitPrice = getCourseSessionAmount(course, item.sessionType);
        const lineSubtotalPaise = toPaise(unitPrice * item.quantity);
        if (lineSubtotalPaise <= 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid amount for course ${course.title}`,
          });
        }

        resolvedItems.push({
          courseId: course._id,
          sessionType: item.sessionType,
          quantity: item.quantity,
          title: course.title,
          unitPrice,
          lineSubtotalPaise,
        });
      }

      const subtotalPaise = resolvedItems.reduce(
        (sum, item) => sum + item.lineSubtotalPaise,
        0
      );

      let appliedCoupon = null;
      let couponDiscountPaise = 0;
      let referralDiscountPaise = 0;
      const normalizedCouponCode = String(appliedCouponCode || "")
        .trim()
        .toUpperCase();

      if (normalizedCouponCode) {
        const coupon = await Coupon.findOne({
          code: normalizedCouponCode,
          isActive: true,
          expiresAt: { $gt: new Date() },
        });

        if (!coupon) {
          return res.status(400).json({
            success: false,
            message: "Invalid or expired coupon code",
          });
        }

        if (coupon.discountType === "percentage") {
          couponDiscountPaise = Math.round(
            (subtotalPaise * Number(coupon.discountValue || 0)) / 100
          );
        } else {
          couponDiscountPaise = toPaise(coupon.discountValue);
        }

        couponDiscountPaise = Math.min(Math.max(couponDiscountPaise, 0), subtotalPaise);
        appliedCoupon = coupon;
      }

      const coinSettings = await getCoinSettings();
      const referralDiscountPercent = Math.min(
        100,
        Math.max(0, Number(coinSettings?.referralUsageDiscountPercent || 0))
      );
      const isReferralDiscountEligible =
        Boolean(student.referredBy) && !Boolean(student.referralBenefitsUsed);

      if (isReferralDiscountEligible && referralDiscountPercent > 0) {
        const referralDiscountBasePaise = Math.max(0, subtotalPaise - couponDiscountPaise);
        referralDiscountPaise = Math.round(
          (referralDiscountBasePaise * referralDiscountPercent) / 100
        );
        referralDiscountPaise = Math.min(
          Math.max(referralDiscountPaise, 0),
          referralDiscountBasePaise
        );
      }

      const totalDiscountPaise = couponDiscountPaise + referralDiscountPaise;
      const finalTotalPaise = subtotalPaise - totalDiscountPaise;
      if (finalTotalPaise <= 0) {
        return res.status(400).json({
          success: false,
          message: "Final amount must be greater than 0",
        });
      }

      const perItemDiscountPaise = resolvedItems.map(() => 0);
      if (totalDiscountPaise > 0 && subtotalPaise > 0) {
        let allocated = 0;
        for (let index = 0; index < resolvedItems.length; index += 1) {
          if (index === resolvedItems.length - 1) {
            perItemDiscountPaise[index] = totalDiscountPaise - allocated;
          } else {
            const share = Math.floor(
              (totalDiscountPaise * resolvedItems[index].lineSubtotalPaise) / subtotalPaise
            );
            perItemDiscountPaise[index] = share;
            allocated += share;
          }
        }
      }

      const amountInPaise = finalTotalPaise;
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

      const checkoutBatchId = `chk_${Date.now()}_${String(studentId).slice(-6)}`;

      console.info("Creating Razorpay order", {
        studentId: String(studentId),
        courseCount: resolvedItems.length,
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
          checkoutBatchId,
          itemCount: String(resolvedItems.length),
        },
      });

      const createdTransactions = await Promise.all(
        resolvedItems.map((item, index) => {
          const itemDiscountPaise = perItemDiscountPaise[index] || 0;
          const itemFinalPaise = Math.max(0, item.lineSubtotalPaise - itemDiscountPaise);
          const itemAmount = fromPaise(itemFinalPaise);

          return new Transaction({
            studentId,
            courseId: item.courseId,
            sessionType: item.sessionType,
            amount: itemAmount,
            paymentMethod: "razorpay",
            razorpayOrderId: order.id,
            billingAddress,
            shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
            sameAsBilling: Boolean(sameAsBilling),
            bundleItems: resolvedItems.map((bundleItem) => ({
              courseId: bundleItem.courseId,
              sessionType: bundleItem.sessionType,
              quantity: bundleItem.quantity,
              title: bundleItem.title,
              unitPrice: bundleItem.unitPrice,
            })),
            additionalNotes: JSON.stringify({
              checkoutBatchId,
              couponCode: appliedCoupon?.code || "",
              couponDiscount: fromPaise(couponDiscountPaise),
              referralDiscount: fromPaise(referralDiscountPaise),
              referralDiscountPercentApplied: referralDiscountPercent,
              referralDiscountEligible: isReferralDiscountEligible,
              itemDiscount: fromPaise(itemDiscountPaise),
            }),
          }).save();
        })
      );

      return res.status(200).json({
        success: true,
        message: "Order created successfully",
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          transactionIds: createdTransactions.map((transaction) => transaction._id),
          key: process.env.RAZORPAY_KEY_ID,
          totals: {
            subtotal: fromPaise(subtotalPaise),
            couponDiscount: fromPaise(couponDiscountPaise),
            referralDiscount: fromPaise(referralDiscountPaise),
            finalTotal: fromPaise(finalTotalPaise),
          },
          referralBenefits: {
            eligible: isReferralDiscountEligible,
            discountPercent: referralDiscountPercent,
            rewardCoins: Number(coinSettings?.referralUsageCoins || 0),
          },
        },
      });
    }

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

    const existingBooking = await CourseBooking.findOne({
      studentId,
      itemType: "single_course",
      courseId,
      sessionType,
      status: { $in: activeCourseBookingStatuses },
      paymentStatus: { $ne: "failed" },
      remainingAmount: { $gt: 0 },
    }).select("remainingAmount");

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        code: "BOOKING_BALANCE_PENDING",
        message:
          "This course already has an active booking. Please go to your dashboard, open the Bookings page, and make the remaining balance payment. Purchase is not allowed from checkout.",
        data: {
          courseId,
          sessionType,
          remainingAmount: Number(existingBooking.remainingAmount || 0),
        },
      });
    }

    const serverUnitAmount = getCourseSessionAmount(course, sessionType);
    const sanitizedQuantity = Math.max(1, parseInt(quantity, 10) || 1);
    const serverAmount = serverUnitAmount * sanitizedQuantity;

    const numericAmount = Number(amount) > 0 ? Number(amount) : serverAmount;
    const baseAmount = Math.max(serverAmount, numericAmount);
    const coinSettings = await getCoinSettings();
    const referralDiscountPercent = Math.min(
      100,
      Math.max(0, Number(coinSettings?.referralUsageDiscountPercent || 0))
    );
    const isReferralDiscountEligible =
      Boolean(student.referredBy) && !Boolean(student.referralBenefitsUsed);
    const referralDiscountAmount = isReferralDiscountEligible
      ? Number(((baseAmount * referralDiscountPercent) / 100).toFixed(2))
      : 0;
    const finalAmount = Number(
      Math.max(0, baseAmount - referralDiscountAmount).toFixed(2)
    );

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
          amount: toPaise(pendingExisting.amount || finalAmount),
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
      additionalNotes: JSON.stringify({
        couponCode: "",
        couponDiscount: 0,
        referralDiscount: referralDiscountAmount,
        referralDiscountPercentApplied: referralDiscountPercent,
        referralDiscountEligible: isReferralDiscountEligible,
        itemDiscount: referralDiscountAmount,
      }),
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
        transactionIds: [transaction._id],
        key: process.env.RAZORPAY_KEY_ID,
        totals: {
          subtotal: Number(baseAmount.toFixed(2)),
          couponDiscount: 0,
          referralDiscount: referralDiscountAmount,
          finalTotal: finalAmount,
        },
        referralBenefits: {
          eligible: isReferralDiscountEligible,
          discountPercent: referralDiscountPercent,
          rewardCoins: Number(coinSettings?.referralUsageCoins || 0),
        },
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

const verifyAndCaptureHandler = async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
      transactionIds,
    } = req.body;

    const transactionIdList = Array.from(
      new Set(
        [
          ...(Array.isArray(transactionIds) ? transactionIds : []),
          ...(transactionId ? [transactionId] : []),
        ]
          .map((id) => String(id || "").trim())
          .filter(Boolean)
      )
    );

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
      });
    }

    if (!transactionIdList.length) {
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const orderNotes = order?.notes || {};

      if (
        ![
          LEGACY_BOOKING_PAYMENT_PURPOSE,
          LIVE_SESSION_PAYMENT_PURPOSE,
        ].includes(orderNotes.paymentPurpose)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "transactionId or transactionIds are required for non-booking payments",
        });
      }

      const isValidLegacySignature = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        secret: process.env.RAZORPAY_KEY_SECRET,
      });

      if (!isValidLegacySignature) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      if (orderNotes.paymentPurpose === LIVE_SESSION_PAYMENT_PURPOSE) {
        const { booking, alreadyExists } = await createLiveSessionBookingFromOrder({
          order,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        });

        try {
          await sendReceiptForLiveSessionBooking(booking._id);
        } catch (receiptError) {
          console.error(
            "Live session receipt send failed after payment verification:",
            receiptError
          );
        }

        return res.status(200).json({
          success: true,
          message: alreadyExists
            ? "Payment already verified"
            : "Payment verified and live session booked",
          data: {
            bookingId: booking._id,
            status: booking.status,
            receipt: normalizeLiveSessionReceipt(booking),
          },
        });
      }

      const { booking, alreadyExists } = await createLegacyBookingFromOrder({
        order,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      return res.status(200).json({
        success: true,
        message: alreadyExists
          ? "Payment already verified"
          : "Payment verified and booking created",
        data: {
          bookingId: booking._id,
          status: booking.status,
          receipt: normalizeLegacyBookingReceipt(booking),
        },
      });
    }

    const transactions = await Transaction.find({
      _id: { $in: transactionIdList },
    });
    if (transactions.length !== transactionIdList.length) {
      return res.status(404).json({
        success: false,
        message: "One or more transactions were not found",
      });
    }

    const firstStudentId = String(transactions[0].studentId);
    const mismatchedStudent = transactions.some(
      (txn) => String(txn.studentId) !== firstStudentId
    );
    if (mismatchedStudent) {
      return res.status(400).json({
        success: false,
        message: "Transactions belong to different students",
      });
    }

    const alreadyApproved = transactions.every(
      (txn) =>
        txn.status === "approved" && txn.razorpayPaymentId === razorpay_payment_id
    );

    const mismatchedOrder = transactions.some(
      (txn) => txn.razorpayOrderId && txn.razorpayOrderId !== razorpay_order_id
    );
    if (mismatchedOrder) {
      return res.status(400).json({
        success: false,
        message: "Order mismatch for one or more transactions",
      });
    }

    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret: process.env.RAZORPAY_KEY_SECRET,
    });

    if (!isValidSignature) {
      await Promise.all(
        transactions.map(async (txn) => {
          if (txn.status === "approved") return;
          txn.status = "rejected";
          txn.adminNotes = "Razorpay signature mismatch";
          txn.razorpayPaymentId = razorpay_payment_id;
          txn.razorpaySignature = razorpay_signature;
          await txn.save();
        })
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const failedTransactionIds = [];
    let sentReceipts = 0;

    for (const txn of transactions) {
      try {
        if (!alreadyApproved) {
          if (txn.status !== "approved") {
            txn.status = "approved";
            txn.razorpayOrderId = razorpay_order_id;
            txn.razorpayPaymentId = razorpay_payment_id;
            txn.razorpaySignature = razorpay_signature;
            txn.utrNumber = razorpay_payment_id;
            await txn.save();
          }

          await syncStudentEnrollment(txn);
        }

        // Always retry receipt send if missing, even for already-approved retries.
        if (txn.status === "approved" && !txn.receiptSent) {
          try {
            const receiptStatus = await sendReceiptForApprovedTransaction(txn._id);
            if (receiptStatus?.sent) sentReceipts += 1;
          } catch (receiptError) {
            console.error(
              "Receipt send failed after payment verification:",
              receiptError
            );
          }
        }
      } catch (txnError) {
        console.error("Transaction post-verify processing failed:", txnError);
        failedTransactionIds.push(String(txn._id));
      }
    }

    if (failedTransactionIds.length) {
      return res.status(207).json({
        success: false,
        message: "Payment captured but some enrollments need retry",
        data: {
          failedTransactionIds,
          transactionIds: transactions.map((txn) => txn._id),
        },
      });
    }

    let coinAwarded = false;
    let coinsAwarded = 0;
    let referralCoinAwarded = false;
    let referralCoinsAwarded = 0;
    let referralBenefitsUsedNow = false;
    let coinBalance;
    let coinAwardReason = "";
    let referralCoinAwardReason = "";

    try {
      const settings = await getCoinSettings();
      const purchaseCoins = Number(settings?.purchaseSuccessCoins || 0);
      const referralPurchaseCoins = Number(settings?.referralUsageCoins || 0);
      const student = await Student.findById(transactions[0].studentId).select(
        "_id referredBy referralBenefitsUsed"
      );
      const isReferralBenefitEligible =
        Boolean(student?.referredBy) && !Boolean(student?.referralBenefitsUsed);
      const referralDiscountConsumed = transactions.some((txn) => {
        const notes = parseTransactionNotes(txn.additionalNotes);
        return Number(notes?.referralDiscount || 0) > 0;
      });

      if (purchaseCoins > 0) {
        const coinResult = await awardCoins({
          studentId: String(transactions[0].studentId),
          eventType: "PURCHASE_SUCCESS",
          coins: purchaseCoins,
          metadata: {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            transactionIds: transactions.map((txn) => String(txn._id)),
            coinRule: "per_checkout",
          },
          idempotencyKey: `purchase_checkout:${String(
            transactions[0].studentId
          )}:${razorpay_order_id}:${razorpay_payment_id}`,
        });

        coinAwarded = Boolean(coinResult?.awarded);
        coinsAwarded = coinResult?.awarded ? purchaseCoins : 0;
        if (typeof coinResult?.coinBalance === "number") {
          coinBalance = coinResult.coinBalance;
        }
        if (!coinResult?.awarded && coinResult?.reason) {
          coinAwardReason = String(coinResult.reason);
        }
      } else {
        coinAwardReason = "purchase_coins_disabled";
      }

      if (isReferralBenefitEligible && referralPurchaseCoins > 0) {
        const referralCoinResult = await awardCoins({
          studentId: String(transactions[0].studentId),
          eventType: "REFERRAL_PURCHASE",
          coins: referralPurchaseCoins,
          metadata: {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            transactionIds: transactions.map((txn) => String(txn._id)),
            referralDiscountConsumed,
          },
          idempotencyKey: `referral_purchase:${String(
            transactions[0].studentId
          )}:${razorpay_order_id}:${razorpay_payment_id}`,
        });

        referralCoinAwarded = Boolean(referralCoinResult?.awarded);
        referralCoinsAwarded = referralCoinResult?.awarded ? referralPurchaseCoins : 0;
        if (typeof referralCoinResult?.coinBalance === "number") {
          coinBalance = referralCoinResult.coinBalance;
        }
        if (!referralCoinResult?.awarded && referralCoinResult?.reason) {
          referralCoinAwardReason = String(referralCoinResult.reason);
        }
      } else if (!isReferralBenefitEligible) {
        referralCoinAwardReason = "not_eligible_or_already_used";
      } else {
        referralCoinAwardReason = "referral_purchase_coins_disabled";
      }

      const shouldMarkReferralBenefitsUsed =
        isReferralBenefitEligible && (referralDiscountConsumed || referralCoinAwarded);
      if (shouldMarkReferralBenefitsUsed) {
        await Student.updateOne(
          {
            _id: transactions[0].studentId,
            referralBenefitsUsed: { $ne: true },
          },
          {
            $set: {
              referralBenefitsUsed: true,
              referralBenefitsUsedAt: new Date(),
            },
          }
        );
        referralBenefitsUsedNow = true;
      }
    } catch (coinError) {
      coinAwardReason = "coin_award_failed";
      console.error("Purchase coin award failed:", {
        studentId: String(transactions[0].studentId),
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        error: coinError?.message || coinError,
      });
    }

    return res.status(200).json({
      success: true,
      message: alreadyApproved
        ? "Payment already verified"
        : "Payment verified and enrollment completed",
      data: {
        transactionIds: transactions.map((txn) => txn._id),
        studentId: transactions[0].studentId,
        status: "approved",
        receiptSentCount: sentReceipts,
        coinAwarded,
        coinsAwarded,
        referralCoinAwarded,
        referralCoinsAwarded,
        referralBenefitsUsedNow,
        ...(typeof coinBalance === "number" ? { coinBalance } : {}),
        ...(coinAwardReason ? { coinAwardReason } : {}),
        ...(referralCoinAwardReason ? { referralCoinAwardReason } : {}),
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
};

router.post("/verify-and-capture", verifyAndCaptureHandler);

router.post("/verify", verifyAndCaptureHandler);

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

router.get("/receipts/booking/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking || booking.paymentMethod !== "razorpay") {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const payload = booking.liveSessionId
      ? normalizeLiveSessionReceipt(booking)
      : normalizeLegacyBookingReceipt(booking);

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching booking receipt:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch receipt",
      error: error.message,
    });
  }
});

router.get("/receipts", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    const bookings = await Booking.find({
      by: email,
      paymentMethod: "razorpay",
      razorpayOrderId: { $ne: "" },
    }).sort({ paymentVerifiedAt: -1, createdAt: -1 });

    return res.status(200).json(
      bookings
        .map((booking) =>
          booking.liveSessionId
            ? normalizeLiveSessionReceipt(booking)
            : normalizeLegacyBookingReceipt(booking)
        )
        .filter(Boolean)
    );
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch receipts",
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
