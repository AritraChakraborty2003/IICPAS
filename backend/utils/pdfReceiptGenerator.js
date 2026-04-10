import { generateBookingInvoicePDF } from "./pdfBookingInvoiceGenerator.js";

const toTitleCase = (value) => {
  const text = String(value || "").trim();
  if (!text) return "N/A";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const buildBookingInvoicePayload = (transaction) => {
  const amount = Number(transaction?.amount || 0);

  return {
    booking: {
      _id: transaction?._id,
      studentId: {
        name: transaction?.studentId?.name || "Student",
        email: transaction?.studentId?.email || "N/A",
      },
      studentEmail: transaction?.studentId?.email || "N/A",
      itemTitle: transaction?.courseId?.title || "Course",
      sessionType: toTitleCase(transaction?.sessionType),
      itemType: "single_course",
      baseAmount: amount,
      bookingPercent: 100,
      bookingAmount: amount,
      paidAmount: amount,
      remainingAmount: 0,
    },
    payment: {
      amount,
      paymentType: "booking",
      paidAt: transaction?.updatedAt || transaction?.createdAt || new Date(),
      razorpayOrderId: transaction?.razorpayOrderId || "",
      razorpayPaymentId: transaction?.razorpayPaymentId || "",
    },
  };
};

export const generateReceiptPDF = async (transaction) => {
  const { booking, payment } = buildBookingInvoicePayload(transaction);
  return generateBookingInvoicePDF(booking, payment);
};
