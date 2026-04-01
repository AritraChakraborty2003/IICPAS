import PDFDocument from "pdfkit";

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const generateLiveSessionReceiptPDF = (booking) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: {
        Title: `Live Session Receipt ${String(booking?._id || "").slice(-8)}`,
        Author: "IICPA Institute",
      },
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).fillColor("#0f172a").text("IICPA Institute");
    doc
      .fontSize(14)
      .fillColor("#334155")
      .text("Live Session Payment Receipt", { align: "left" });
    doc.moveDown(1);

    doc.fontSize(11).fillColor("#111827").text(`Receipt ID: ${booking?._id || "N/A"}`);
    doc.text(`Session: ${booking?.title || "Live Session"}`);
    doc.text(`Participant: ${booking?.requesterName || "N/A"}`);
    doc.text(`Email: ${booking?.by || "N/A"}`);
    doc.text(`Phone: ${booking?.phone || "N/A"}`);
    doc.text(`WhatsApp: ${booking?.whatsappNumber || booking?.phone || "N/A"}`);
    doc.text(`Session Date: ${formatDateTime(booking?.date)}`);
    doc.text(`Payment Amount: ${formatCurrency(booking?.paymentAmount)}`);
    doc.text(`Payment Method: ${booking?.paymentMethod || "N/A"}`);
    doc.text(`Payment Status: ${booking?.paymentStatus || "N/A"}`);
    doc.text(`Razorpay Order ID: ${booking?.razorpayOrderId || "N/A"}`);
    doc.text(`Razorpay Payment ID: ${booking?.razorpayPaymentId || "N/A"}`);
    doc.text(`Paid At: ${formatDateTime(booking?.paymentVerifiedAt || booking?.updatedAt)}`);

    doc.moveDown(1);
    doc
      .fontSize(10)
      .fillColor("#475569")
      .text(
        "This receipt confirms your live session booking payment. Please keep it for your records."
      );

    doc.end();
  });
