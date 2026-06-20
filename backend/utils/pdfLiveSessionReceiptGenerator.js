import PDFDocument from "pdfkit";
import InvoiceCompanySettings from "../models/InvoiceCompanySettings.js";

const formatRupees = (amount) =>
  Number(amount || 0)
    .toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })
    .replace(/^/, "Rs. ");

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

const formatPaymentMethod = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "N/A";
  if (text === "razorpay") return "Razorpay";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const shortRef = (value, head = 10, tail = 8) => {
  const text = String(value || "").trim();
  if (!text) return "N/A";
  if (text.length <= head + tail + 3) return text;
  return `${text.slice(0, head)}...${text.slice(-tail)}`;
};

export const generateLiveSessionReceiptPDF = async (booking) => {
  let companySettings = null;
  try {
    companySettings = await InvoiceCompanySettings.getSettings();
  } catch (error) {
    companySettings = null;
  }

  const invoiceNumber = `LS-INV-${String(booking?._id || "").slice(-8).toUpperCase()}`;

  const companyAddress = [
    companySettings?.addressLine1,
    companySettings?.addressLine2,
    companySettings?.city,
    companySettings?.state,
    companySettings?.pincode,
    companySettings?.country,
  ]
    .filter((part) => String(part || "").trim() !== "")
    .join(", ");

  const companyLines = [
    companySettings?.gstin ? `GSTIN: ${companySettings.gstin}` : "",
    companySettings?.cin ? `CIN: ${companySettings.cin}` : "",
    companySettings?.pan ? `PAN: ${companySettings.pan}` : "",
    companySettings?.email ? `Email: ${companySettings.email}` : "",
    companySettings?.phone ? `Phone: ${companySettings.phone}` : "",
    companySettings?.website ? `Website: ${companySettings.website}` : "",
  ].filter(Boolean);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: {
        Title: `Live Session Invoice ${String(booking?._id || "").slice(-8)}`,
        Author: companySettings?.companyName || "IICPA Institute",
      },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;
    const contentWidth = right - left;

    const colors = {
      navy: "#0f172a",
      slate: "#334155",
      muted: "#64748b",
      border: "#dbe3ee",
      bg: "#f8fafc",
      green: "#059669",
      softGreen: "#ecfdf5",
    };

    const drawCard = (y, height, fill = "#ffffff") => {
      doc.roundedRect(left, y, contentWidth, height, 14).fillAndStroke(fill, colors.border);
    };

    const drawField = (x, y, w, label, value) => {
      const valueText = String(value || "N/A");
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.muted).text(label, x, y, {
        width: w,
      });
      const valueY = y + 12;
      doc.font("Helvetica").fontSize(10.5).fillColor(colors.navy).text(valueText, x, valueY, {
        width: w,
      });
      return valueY + doc.heightOfString(valueText, { width: w, align: "left" }) + 8;
    };

    doc.roundedRect(left, 18, contentWidth, 56, 10).fillAndStroke("#ffffff", colors.border);
    doc.fillColor(colors.navy);
    doc
      .font("Helvetica-Bold")
      .fontSize(17)
      .text(companySettings?.companyName || "IICPA Institute", left + 14, 30);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(colors.muted)
      .text("Live Session Invoice", left + 14, 50);

    const badgeWidth = 150;
    doc.roundedRect(right - badgeWidth - 14, 30, badgeWidth, 28, 8).fill("#f8fafc");
    doc.fillColor(colors.muted);
    doc.font("Helvetica").fontSize(7).text("INVOICE NO", right - badgeWidth, 36, {
      width: badgeWidth - 18,
      align: "right",
    });
    doc
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor(colors.navy)
      .text(invoiceNumber, right - badgeWidth, 46, {
        width: badgeWidth - 18,
        align: "right",
      });

    let y = 90;

    const billedByCardHeight = 112;
    drawCard(y, billedByCardHeight);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.muted).text("BILLED BY", left + 16, y + 14);
    doc
      .font("Helvetica-Bold")
      .fontSize(11.5)
      .fillColor(colors.navy)
      .text(companySettings?.legalName || companySettings?.companyName || "IICPA Institute", left + 16, y + 28, {
        width: contentWidth - 36,
      });

    let byY = y + 44;
    if (companyAddress) {
      doc.font("Helvetica").fontSize(8.5).fillColor(colors.slate).text(companyAddress, left + 16, byY, {
        width: contentWidth - 36,
      });
      byY += doc.heightOfString(companyAddress, { width: contentWidth - 36 }) + 2;
    }

    companyLines.forEach((line) => {
      doc.font("Helvetica").fontSize(8).fillColor(colors.slate).text(line, left + 16, byY, {
        width: contentWidth - 36,
      });
      byY += 10.5;
    });

    y += billedByCardHeight + 10;

    const invoiceDetailsHeight = 128;
    drawCard(y, invoiceDetailsHeight, colors.bg);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.muted).text("INVOICE DETAILS", left + 16, y + 12);

    const detailColWidth = (contentWidth - 50) / 2;
    const detailLeftX = left + 16;
    const detailRightX = left + 16 + detailColWidth + 14;

    let detailLeftY = y + 30;
    detailLeftY = drawField(
      detailLeftX,
      detailLeftY,
      detailColWidth,
      "Participant",
      booking?.requesterName || booking?.studentId?.name || "Student"
    );
    detailLeftY = drawField(detailLeftX, detailLeftY + 2, detailColWidth, "Session", booking?.title || "Live Session");

    let detailRightY = y + 30;
    detailRightY = drawField(detailRightX, detailRightY, detailColWidth, "Email", booking?.by || "N/A");
    drawField(detailRightX, detailRightY + 2, detailColWidth, "Session Type", "Live");

    const pillWidth = 132;
    const pillY = y + 14;
    const pillX = right - pillWidth - 16;
    doc.roundedRect(pillX, pillY, pillWidth, 24, 12).fill(colors.softGreen);
    doc.fillColor(colors.green);
    doc.font("Helvetica-Bold").fontSize(7.5).text("LIVE SESSION PAYMENT", pillX, pillY + 7, {
      width: pillWidth,
      align: "center",
    });

    y += invoiceDetailsHeight + 10;

    const summaryCardHeight = 166;
    drawCard(y, summaryCardHeight);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.muted).text("PAYMENT SUMMARY", left + 16, y + 12);

    const summaryLeft = [
      ["Enrollment ID", String(booking?._id || "N/A")],
      ["Session Date", formatDateTime(booking?.date)],
      ["Payment Method", formatPaymentMethod(booking?.paymentMethod)],
      ["Paid At", formatDateTime(booking?.paymentVerifiedAt || booking?.updatedAt || booking?.createdAt)],
    ];

    const summaryRight = [
      ["Phone", booking?.phone || "N/A"],
      ["WhatsApp", booking?.whatsappNumber || booking?.phone || "N/A"],
      ["Razorpay Order ID", shortRef(booking?.razorpayOrderId || "N/A")],
      ["Razorpay Payment ID", shortRef(booking?.razorpayPaymentId || "N/A")],
    ];

    let summaryLeftY = y + 28;
    summaryLeft.forEach(([label, value]) => {
      summaryLeftY = drawField(detailLeftX, summaryLeftY, detailColWidth, label, value);
    });

    let summaryRightY = y + 28;
    summaryRight.forEach(([label, value]) => {
      summaryRightY = drawField(detailRightX, summaryRightY, detailColWidth, label, value);
    });

    y += summaryCardHeight + 10;

    const amountCardHeight = 108;
    drawCard(y, amountCardHeight, "#ffffff");
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.muted).text("AMOUNTS", left + 16, y + 12);

    const paymentAmount = Number(booking?.paymentAmount || 0);
    const amountRows = [
      ["Session Fee", formatRupees(paymentAmount)],
      ["Amount Paid", formatRupees(paymentAmount)],
      ["Total Paid", formatRupees(paymentAmount)],
    ];

    const amountLeftX = left + 16;
    const amountRightX = right - 155;
    let amountY = y + 34;
    amountRows.forEach(([label, value], index) => {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.slate).text(label, amountLeftX, amountY, {
        width: contentWidth - 195,
      });
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(index === amountRows.length - 1 ? colors.green : colors.navy)
        .text(value, amountRightX, amountY, {
          width: 150,
          align: "right",
        });
      amountY += 20;
    });

    y += amountCardHeight + 10;

    // Session access details card (join link + passcode)
    const sessionLink = String(booking?.link || "").trim();
    const sessionPasscode = String(booking?.passcode || "").trim();
    const sessionTime = String(booking?.time || "").trim();

    if (sessionLink || sessionPasscode || sessionTime) {
      const accessRows = [];
      if (sessionTime) accessRows.push(["Session Time", sessionTime]);
      if (sessionLink) accessRows.push(["Join Link", sessionLink]);
      if (sessionPasscode) accessRows.push(["Passcode", sessionPasscode]);

      const accessCardHeight = 24 + accessRows.length * 32;
      drawCard(y, accessCardHeight, "#f0fdf4");
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(colors.green)
        .text("SESSION ACCESS", left + 16, y + 12);

      let accessY = y + 28;
      accessRows.forEach(([label, value]) => {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.muted).text(label, left + 16, accessY, {
          width: contentWidth - 32,
        });
        doc.font("Helvetica").fontSize(9.5).fillColor(colors.navy).text(value, left + 16, accessY + 12, {
          width: contentWidth - 32,
        });
        accessY += 32;
      });

      y += accessCardHeight + 10;
    }

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(colors.muted)
      .text(
        "This invoice confirms your live session enrollment payment. Please keep it for your records.",
        left,
        748,
        { width: contentWidth, align: "center" }
      );

    const stampX = left + 6;
    const stampY = 740;
    const stampW = 84;
    const stampH = 28;
    doc.save();
    doc.roundedRect(stampX, stampY, stampW, stampH, 6).fillAndStroke("#ecfdf5", "#16a34a");
    doc.fillColor("#15803d");
    doc.font("Helvetica-Bold").fontSize(12).text("PAID", stampX, stampY + 8, {
      width: stampW,
      align: "center",
    });
    doc.restore();

    doc.end();
  });
};
