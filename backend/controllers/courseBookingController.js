import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import Course from "../models/Content/Course.js";
import GroupPricing from "../models/GroupPricing.js";
import Student from "../models/Students.js";
import BookingSettings from "../models/BookingSettings.js";
import CourseBooking from "../models/CourseBooking.js";
import {
  buildCourseBookingInvoiceDownloadUrl,
  verifyCourseBookingInvoiceDownloadToken,
} from "../services/invoiceLinkService.js";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppRecipient,
} from "../config/whatsappConfig.js";
import { sendWhatsAppTemplateMessage } from "../services/whatsappService.js";
import { generateBookingInvoicePDF } from "../utils/pdfBookingInvoiceGenerator.js";
import { sendBookingInvoiceEmail } from "../utils/bookingEmailService.js";

let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.error("Razorpay init failed for course bookings:", error.message);
}

const toPaise = (amount) => Math.max(0, Math.round(Number(amount || 0) * 100));
const fromPaise = (amount) => Number((Number(amount || 0) / 100).toFixed(2));
const COURSE_PURCHASE_WHATSAPP_TEMPLATE_NAME =
  process.env.WHATSAPP_COURSE_PURCHASE_TEMPLATE_NAME ||
  "course_purchase_invoice_iicpa";

const ensureRazorpayConfigured = (res) => {
  if (!razorpay) {
    res.status(500).json({
      success: false,
      message:
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    });
    return false;
  }
  return true;
};

const resolveRequestApiBaseUrl = (req) => {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = String(req.headers["x-forwarded-host"] || "")
    .split(",")[0]
    .trim();
  const host = forwardedHost || req.get("host") || "";

  if (!host) {
    return "";
  }

  const baseUrl = `${protocol}://${host}`.replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
};

const getSingleCourseBaseAmount = (course, sessionType = "recorded") => {
  if (!course) return 0;
  if (sessionType === "live") {
    return (
      Number(course?.pricing?.liveSession?.finalPrice) ||
      Number(course?.pricing?.liveSession?.price) ||
      0
    );
  }
  return (
    Number(course?.pricing?.recordedSession?.finalPrice) ||
    Number(course?.pricing?.recordedSession?.price) ||
    Number(course?.price) ||
    0
  );
};

const getGroupPackageBaseAmount = (groupPackage) => {
  if (!groupPackage) return 0;
  const prices = [
    Number(groupPackage?.pricing?.recordedSession?.finalPrice),
    Number(groupPackage?.pricing?.liveSession?.finalPrice),
    Number(groupPackage?.pricing?.recordedSessionCenter?.finalPrice),
    Number(groupPackage?.pricing?.liveSessionCenter?.finalPrice),
  ].filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length > 0) return Math.min(...prices);
  return Number(groupPackage?.groupPrice) || 0;
};

const normalizeStatus = (booking) => {
  const remaining = Number(booking.remainingAmount || 0);
  const paid = Number(booking.paidAmount || 0);
  if (remaining <= 0) {
    booking.status = "fully_paid";
    booking.paymentStatus = "paid";
    booking.remainingAmount = 0;
    return booking;
  }
  if (paid <= 0) {
    booking.status = "prebooked";
    booking.paymentStatus = "pending";
    return booking;
  }
  if (paid < booking.baseAmount) {
    booking.status = "partially_paid";
    booking.paymentStatus = "paid";
    return booking;
  }
  booking.status = "fully_paid";
  booking.paymentStatus = "paid";
  booking.remainingAmount = 0;
  return booking;
};

const buildReceipt = (studentId) => {
  const suffix = String(studentId || "student")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8);
  return `bk_${Date.now()}_${suffix}`.slice(0, 40);
};

const createOrderNotes = (payload) => {
  const notes = {};
  Object.keys(payload || {}).forEach((key) => {
    notes[key] = String(payload[key] ?? "");
  });
  return notes;
};

const getStudentFromCookie = async (req) => {
  const studentId = req.user?.id;
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) return null;
  return Student.findById(studentId).select("name email phone");
};

const objectIdEquals = (left, right) => {
  if (!left || !right) return false;
  return String(left) === String(right);
};

const syncStudentEnrollmentFromBooking = async (booking) => {
  if (!booking) return;
  if (booking.itemType !== "single_course") return;
  if (!booking.courseId) return;

  const isFullyPaid =
    String(booking.status) === "fully_paid" ||
    Number(booking.remainingAmount || 0) <= 0;
  if (!isFullyPaid) return;

  const student = await Student.findById(booking.studentId).select(
    "course enrolledRecordedSessions enrolledLiveSessions"
  );
  if (!student) return;

  let changed = false;
  if (!student.course.some((id) => objectIdEquals(id, booking.courseId))) {
    student.course.push(booking.courseId);
    changed = true;
  }

  if (booking.sessionType === "live") {
    if (
      !student.enrolledLiveSessions.some((id) =>
        objectIdEquals(id, booking.courseId)
      )
    ) {
      student.enrolledLiveSessions.push(booking.courseId);
      changed = true;
    }
  } else {
    if (
      !student.enrolledRecordedSessions.some((id) =>
        objectIdEquals(id, booking.courseId)
      )
    ) {
      student.enrolledRecordedSessions.push(booking.courseId);
      changed = true;
    }
  }

  if (changed) {
    await student.save();
  }
};

const buildCourseBookingInvoiceComponents = ({
  studentName,
  courseTitle,
  invoiceUrl,
}) => [
  {
    type: "header",
    parameters: [
      {
        type: "document",
        document: {
          link: invoiceUrl,
          filename: "invoice.pdf",
        },
      },
    ],
  },
  {
    type: "body",
    parameters: [
      {
        type: "text",
        text: studentName || "Student",
      },
      {
        type: "text",
        text: courseTitle || "Course",
      },
    ],
  },
];

const sendCourseBookingWhatsAppInvoice = async (
  booking,
  payment,
  { publicApiBaseUrl = "" } = {}
) => {
  if (!isWhatsAppConfigured()) {
    return {
      sent: false,
      skipped: true,
      reason: "WhatsApp is not configured",
    };
  }

  const invoiceUrl = buildCourseBookingInvoiceDownloadUrl({
    bookingId: String(booking?._id || ""),
    paymentId: String(payment?.razorpayPaymentId || ""),
    baseUrl: publicApiBaseUrl,
  });

  if (!invoiceUrl) {
    return {
      sent: false,
      skipped: true,
      reason: "Public invoice URL is not configured",
    };
  }

  const recipient = normalizeWhatsAppRecipient(
    booking?.studentId?.phone || booking?.studentPhone || ""
  );
  if (!recipient) {
    return {
      sent: false,
      skipped: true,
      reason: "Student phone number is not available",
    };
  }

  const response = await sendWhatsAppTemplateMessage({
    to: recipient,
    templateName: COURSE_PURCHASE_WHATSAPP_TEMPLATE_NAME,
    components: buildCourseBookingInvoiceComponents({
      studentName: booking?.studentId?.name || "Student",
      courseTitle: booking?.itemTitle || "Course",
      invoiceUrl,
    }),
  });

  if (response?.skipped) {
    return {
      sent: false,
      skipped: true,
      reason: response?.reason || "WhatsApp is not configured",
    };
  }

  return {
    sent: true,
    skipped: false,
    response,
  };
};

const sendCourseBookingInvoiceNotifications = async (
  booking,
  payment,
  { publicApiBaseUrl = "" } = {}
) => {
  const currentPaymentId = String(payment?.razorpayPaymentId || "").trim();
  const shouldSendEmail =
    !currentPaymentId || booking?.invoiceSentPaymentId !== currentPaymentId;
  const shouldSendWhatsApp =
    !currentPaymentId ||
    booking?.whatsappInvoiceSentPaymentId !== currentPaymentId;
  let pdfBuffer = null;
  let emailSent = false;
  let whatsappSent = false;

  if (shouldSendEmail) {
    try {
      pdfBuffer = await generateBookingInvoicePDF(booking, payment);
    } catch (pdfError) {
      console.error(
        `PDF generation failed for booking ${booking?._id}. Sending email without attachment:`,
        pdfError.message
      );
    }

    try {
      await sendBookingInvoiceEmail(booking, pdfBuffer);
      booking.invoiceSent = true;
      booking.invoiceSentAt = new Date();
      booking.invoiceSentPaymentId = currentPaymentId;
      emailSent = true;
    } catch (emailError) {
      console.error(
        `Failed to send booking email invoice for ${booking?._id}:`,
        emailError
      );
    }
  }

  if (shouldSendWhatsApp) {
    try {
      const whatsappResult = await sendCourseBookingWhatsAppInvoice(
        booking,
        payment,
        { publicApiBaseUrl }
      );
      if (whatsappResult?.skipped) {
        console.warn(
          `WhatsApp booking invoice skipped for ${booking?._id}: ${whatsappResult.reason || "unknown reason"}`
        );
      } else {
        booking.whatsappInvoiceSent = true;
        booking.whatsappInvoiceSentAt = new Date();
        booking.whatsappInvoiceSentPaymentId = currentPaymentId;
        whatsappSent = true;
      }
    } catch (whatsappError) {
      console.error(
        `Failed to send WhatsApp booking invoice for ${booking?._id}:`,
        whatsappError
      );
    }
  }

  if (emailSent || whatsappSent) {
    await booking.save();
  }

  return { emailSent, whatsappSent };
};

export const createCourseBookingOrder = async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    const student = await getStudentFromCookie(req);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Student authentication required",
      });
    }

    const { paymentType = "booking" } = req.body || {};

    if (paymentType === "balance") {
      const bookingId = req.body?.bookingId;
      if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({
          success: false,
          message: "Valid bookingId is required for balance payment",
        });
      }

      const booking = await CourseBooking.findOne({
        _id: bookingId,
        studentId: student._id,
      });
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (Number(booking.remainingAmount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "This booking is already fully paid",
        });
      }

      const amountPaise = toPaise(booking.remainingAmount);
      if (amountPaise < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid balance amount",
        });
      }

      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: buildReceipt(student._id),
        notes: createOrderNotes({
          paymentType: "balance",
          bookingId: booking._id,
          studentId: student._id,
        }),
      });

      return res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID,
          bookingPreview: {
            bookingId: booking._id,
            itemTitle: booking.itemTitle,
            paymentType: "balance",
            amount: fromPaise(order.amount),
            remainingAmount: booking.remainingAmount,
          },
        },
      });
    }

    const { itemType, courseId, groupPackageId } = req.body || {};
    let { sessionType } = req.body || {};
    if (!["single_course", "group_package"].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: "itemType must be single_course or group_package",
      });
    }

    sessionType = sessionType === "live" ? "live" : "recorded";
    const settings = await BookingSettings.getSettings();

    let baseAmount = 0;
    let itemTitle = "";
    let bookingPercent = 0;

    if (itemType === "single_course") {
      if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Valid courseId is required for single_course booking",
        });
      }
      const course = await Course.findById(courseId).select("title price pricing");
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }
      baseAmount = getSingleCourseBaseAmount(course, sessionType);
      itemTitle = course.title || "Course";
      bookingPercent = Number(settings.singleCourseBookingPercent || 10);
    } else {
      if (!groupPackageId || !mongoose.Types.ObjectId.isValid(groupPackageId)) {
        return res.status(400).json({
          success: false,
          message: "Valid groupPackageId is required for group_package booking",
        });
      }
      const groupPackage = await GroupPricing.findById(groupPackageId).select(
        "groupName level groupPrice pricing"
      );
      if (!groupPackage) {
        return res.status(404).json({
          success: false,
          message: "Group package not found",
        });
      }
      baseAmount = getGroupPackageBaseAmount(groupPackage);
      itemTitle = groupPackage.groupName || groupPackage.level || "Group Package";
      bookingPercent = Number(settings.groupPackageBookingPercent || 5);
      sessionType = null;
    }

    if (baseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate base amount for this item",
      });
    }

    const bookingAmount = Number(
      Math.max(0.01, (baseAmount * bookingPercent) / 100).toFixed(2)
    );
    const bookingAmountPaise = toPaise(bookingAmount);
    if (bookingAmountPaise < 1) {
      return res.status(400).json({
        success: false,
        message: "Calculated booking amount is too low",
      });
    }

    const duplicateQuery = {
      studentId: student._id,
      itemType,
      status: { $in: ["prebooked", "partially_paid", "fully_paid"] },
      paymentStatus: { $ne: "failed" },
    };
    if (itemType === "single_course") {
      duplicateQuery.courseId = courseId;
      duplicateQuery.sessionType = sessionType;
    } else {
      duplicateQuery.groupPackageId = groupPackageId;
    }

    const existing = await CourseBooking.findOne(duplicateQuery).sort({ createdAt: -1 });
    if (existing) {
      const existingRemaining = Number(existing.remainingAmount || 0);
      if (existingRemaining > 0) {
        return res.status(409).json({
          success: false,
          message: "An active booking already exists. Please use Pay Balance.",
          data: {
            bookingId: existing._id,
            remainingAmount: existingRemaining,
            status: existing.status,
          },
        });
      }
      return res.status(409).json({
        success: false,
        message: "This item is already fully paid.",
        data: { bookingId: existing._id, status: existing.status },
      });
    }

    const order = await razorpay.orders.create({
      amount: bookingAmountPaise,
      currency: "INR",
      receipt: buildReceipt(student._id),
      notes: createOrderNotes({
        paymentType: "booking",
        itemType,
        studentId: student._id,
        courseId: courseId || "",
        groupPackageId: groupPackageId || "",
        sessionType: sessionType || "",
        baseAmount: baseAmount.toFixed(2),
        bookingPercent: bookingPercent.toFixed(2),
      }),
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        bookingPreview: {
          itemType,
          courseId: courseId || null,
          groupPackageId: groupPackageId || null,
          sessionType: sessionType || null,
          itemTitle,
          baseAmount: Number(baseAmount.toFixed(2)),
          bookingPercent: Number(bookingPercent.toFixed(2)),
          bookingAmount,
        },
      },
    });
  } catch (error) {
    console.error("Create course booking order failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create booking order",
      error: error.message,
    });
  }
};

export const verifyCourseBookingPayment = async (req, res) => {
  try {
    if (!ensureRazorpayConfigured(res)) return;

    const student = await getStudentFromCookie(req);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Student authentication required",
      });
    }

    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {};

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order, payment and signature are required",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpayOrderId),
      razorpay.payments.fetch(razorpayPaymentId),
    ]);
    const publicApiBaseUrl = resolveRequestApiBaseUrl(req);

    const paidAmount = fromPaise(payment?.amount || order?.amount || 0);
    const notes = order?.notes || {};
    const paymentType = notes.paymentType === "balance" ? "balance" : "booking";

    if (paymentType === "balance") {
      const bookingId = notes.bookingId;
      if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking metadata in Razorpay order",
        });
      }

      const booking = await CourseBooking.findOne({
        _id: bookingId,
        studentId: student._id,
      });
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found for balance payment",
        });
      }

      if (
        booking.payments.some((entry) => entry.razorpayPaymentId === razorpayPaymentId)
      ) {
        await syncStudentEnrollmentFromBooking(booking);
        const existingPayment =
          booking.payments.find(
            (entry) => entry.razorpayPaymentId === razorpayPaymentId
          ) || null;
        const populatedBooking = await CourseBooking.findById(booking._id).populate(
          "studentId",
          "name email phone"
        );
        try {
          await sendCourseBookingInvoiceNotifications(
            populatedBooking,
            existingPayment,
            {
              publicApiBaseUrl,
            }
          );
        } catch (invoiceError) {
          console.error(
            "Invoice generation/email failed for duplicate balance payment:",
            invoiceError
          );
        }
        return res.status(200).json({
          success: true,
          message: "Payment already verified",
          booking,
        });
      }

      booking.paidAmount = Number((booking.paidAmount + paidAmount).toFixed(2));
      booking.remainingAmount = Number(
        Math.max(booking.baseAmount - booking.paidAmount, 0).toFixed(2)
      );
      booking.payments.push({
        paymentType: "balance",
        amount: paidAmount,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paidAt: new Date(),
      });
      normalizeStatus(booking);
      await booking.save();
      await syncStudentEnrollmentFromBooking(booking);

      const populatedBooking = await CourseBooking.findById(booking._id).populate(
        "studentId",
        "name email phone"
      );

      try {
        const latestPayment =
          populatedBooking.payments[populatedBooking.payments.length - 1] || null;
        await sendCourseBookingInvoiceNotifications(
          populatedBooking,
          latestPayment,
          {
            publicApiBaseUrl,
          }
        );
      } catch (invoiceError) {
        console.error("Invoice generation/email failed for balance payment:", invoiceError);
      }

      return res.status(200).json({
        success: true,
        message: "Balance payment verified successfully",
        booking: populatedBooking,
      });
    }

    const itemType = notes.itemType;
    if (!["single_course", "group_package"].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking metadata in Razorpay order",
      });
    }

    const courseId = notes.courseId || null;
    const groupPackageId = notes.groupPackageId || null;
    const sessionType = notes.sessionType || null;
    const bookingPercent = Number(notes.bookingPercent || 0);
    const baseAmount = Number(notes.baseAmount || 0);

    if (baseAmount <= 0 || bookingPercent < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount metadata for booking payment",
      });
    }

    const bookingAmount = Number(
      Math.max(0.01, (baseAmount * bookingPercent) / 100).toFixed(2)
    );
    const expectedPaise = toPaise(bookingAmount);
    if (Math.abs(expectedPaise - Number(order.amount || 0)) > 1) {
      return res.status(400).json({
        success: false,
        message: "Booking amount mismatch detected",
      });
    }

    const itemLookup =
      itemType === "single_course"
        ? await Course.findById(courseId).select("title")
        : await GroupPricing.findById(groupPackageId).select("groupName level");
    if (!itemLookup) {
      return res.status(404).json({
        success: false,
        message: "Course/package not found while verifying payment",
      });
    }

    const duplicateQuery = {
      studentId: student._id,
      itemType,
      status: { $in: ["prebooked", "partially_paid", "fully_paid"] },
    };
    if (itemType === "single_course") {
      duplicateQuery.courseId = courseId;
      duplicateQuery.sessionType = sessionType;
    } else {
      duplicateQuery.groupPackageId = groupPackageId;
    }

    let booking = await CourseBooking.findOne(duplicateQuery).sort({ createdAt: -1 });
    if (
      booking &&
      booking.payments.some((entry) => entry.razorpayPaymentId === razorpayPaymentId)
    ) {
      await syncStudentEnrollmentFromBooking(booking);
      const existingPayment =
        booking.payments.find(
          (entry) => entry.razorpayPaymentId === razorpayPaymentId
        ) || null;
      const populatedBooking = await CourseBooking.findById(booking._id).populate(
        "studentId",
        "name email phone"
      );
      try {
        await sendCourseBookingInvoiceNotifications(
          populatedBooking,
          existingPayment,
          {
            publicApiBaseUrl,
          }
        );
      } catch (invoiceError) {
        console.error(
          "Invoice generation/email failed for duplicate booking payment:",
          invoiceError
        );
      }
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        booking,
      });
    }

    if (!booking) {
      booking = new CourseBooking({
        studentId: student._id,
        studentEmail: student.email || "",
        itemType,
        courseId: itemType === "single_course" ? courseId : null,
        groupPackageId: itemType === "group_package" ? groupPackageId : null,
        itemTitle:
          itemType === "single_course"
            ? itemLookup.title || "Course"
            : itemLookup.groupName || itemLookup.level || "Group Package",
        sessionType: itemType === "single_course" ? sessionType || "recorded" : null,
        baseAmount: Number(baseAmount.toFixed(2)),
        bookingPercent: Number(bookingPercent.toFixed(2)),
        bookingAmount,
        paidAmount: 0,
        remainingAmount: Number(baseAmount.toFixed(2)),
        status: "prebooked",
        paymentStatus: "pending",
        payments: [],
      });
    }

    booking.paidAmount = Number((booking.paidAmount + paidAmount).toFixed(2));
    booking.remainingAmount = Number(
      Math.max(booking.baseAmount - booking.paidAmount, 0).toFixed(2)
    );
    booking.payments.push({
      paymentType: "booking",
      amount: paidAmount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paidAt: new Date(),
    });
    normalizeStatus(booking);
    await booking.save();
    await syncStudentEnrollmentFromBooking(booking);

    const populatedBooking = await CourseBooking.findById(booking._id).populate(
      "studentId",
      "name email phone"
    );

    try {
      const latestPayment =
        populatedBooking.payments[populatedBooking.payments.length - 1] || null;
      await sendCourseBookingInvoiceNotifications(populatedBooking, latestPayment, {
        publicApiBaseUrl,
      });
    } catch (invoiceError) {
      console.error("Invoice generation/email failed for booking payment:", invoiceError);
    }

    return res.status(200).json({
      success: true,
      message: "Booking payment verified successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Verify course booking payment failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify booking payment",
      error: error.message,
    });
  }
};

export const getStudentCourseBookings = async (req, res) => {
  try {
    const student = await getStudentFromCookie(req);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Student authentication required",
      });
    }

    const bookings = await CourseBooking.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Failed to fetch student course bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

export const getAdminCourseBookings = async (req, res) => {
  try {
    const { status, itemType, student, dateFrom, dateTo } = req.query;
    const query = {};

    if (status) query.status = status;
    if (itemType) query.itemType = itemType;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    let bookings = await CourseBooking.find(query)
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    if (student) {
      const term = String(student).toLowerCase().trim();
      bookings = bookings.filter((row) => {
        const name = String(row?.studentId?.name || "").toLowerCase();
        const email = String(row?.studentEmail || row?.studentId?.email || "").toLowerCase();
        return name.includes(term) || email.includes(term);
      });
    }

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Failed to fetch admin course bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

export const resendBookingInvoice = async (req, res) => {
  try {
    const booking = await CourseBooking.findById(req.params.id).populate(
      "studentId",
      "name email"
    );
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const latestPayment = booking.payments?.[booking.payments.length - 1] || null;
    if (!latestPayment) {
      return res.status(400).json({
        success: false,
        message: "No successful payment found for this booking",
      });
    }

    const invoiceBuffer = await generateBookingInvoicePDF(booking, latestPayment);
    await sendBookingInvoiceEmail(booking, invoiceBuffer);
    booking.invoiceSent = true;
    booking.invoiceSentAt = new Date();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Invoice email sent successfully",
    });
  } catch (error) {
    console.error("Failed to resend booking invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send invoice",
      error: error.message,
    });
  }
};

export const downloadBookingInvoice = async (req, res) => {
  try {
    const booking = await CourseBooking.findById(req.params.id).populate(
      "studentId",
      "name email phone"
    );
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // If this request comes from student auth middleware, limit access to own invoices only.
    if (req.user?.id && (!req.user.role || req.user.role === "student")) {
      if (String(booking.studentId?._id || booking.studentId) !== String(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to access this invoice",
        });
      }
    }

    const latestPayment = booking.payments?.[booking.payments.length - 1] || null;
    if (!latestPayment) {
      return res.status(400).json({
        success: false,
        message: "No payment found for this booking",
      });
    }

    const buffer = await generateBookingInvoicePDF(booking, latestPayment);
    const fileName = `Booking-Invoice-${String(booking._id).slice(-8).toUpperCase()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (error) {
    console.error("Failed to download booking invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download invoice",
      error: error.message,
    });
  }
};

export const downloadPublicBookingInvoice = async (req, res) => {
  try {
    const bookingId = String(req.params.id || "").trim();
    const paymentId = String(req.query.paymentId || "").trim();
    const token = String(req.query.token || "").trim();

    if (!bookingId || !paymentId || !token) {
      return res.status(400).json({
        success: false,
        message: "bookingId, paymentId, and token are required",
      });
    }

    if (
      !verifyCourseBookingInvoiceDownloadToken({
        bookingId,
        paymentId,
        token,
      })
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid invoice link",
      });
    }

    const booking = await CourseBooking.findById(bookingId).populate(
      "studentId",
      "name email phone"
    );
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const latestPayment =
      booking.payments?.find((entry) => entry.razorpayPaymentId === paymentId) ||
      null;
    if (!latestPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found for this booking",
      });
    }

    const buffer = await generateBookingInvoicePDF(booking, latestPayment);
    const fileName = `Booking-Invoice-${String(booking._id)
      .slice(-8)
      .toUpperCase()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (error) {
    console.error("Failed to download public booking invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download invoice",
      error: error.message,
    });
  }
};
