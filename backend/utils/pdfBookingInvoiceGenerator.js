import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import InvoiceCompanySettings from "../models/InvoiceCompanySettings.js";

const formatRupees = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  }).replace(/^/, "Rs. ");

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

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const generateFallbackInvoicePDF = ({
  booking,
  payment,
  invoiceNumber,
  paymentType,
  itemTypeLabel,
  companySettings,
  companyAddress,
}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: {
        Title: `Booking Invoice ${invoiceNumber}`,
        Author: companySettings?.companyName || "IICPA Institute",
      },
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
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
      teal: "#0f766e",
      amber: "#f59e0b",
      red: "#dc2626",
      blue: "#2563eb",
      softBlue: "#eff6ff",
      softGreen: "#ecfdf5",
      softAmber: "#fffbeb",
    };

    const drawCard = (y, height, fill = "#ffffff") => {
      doc.roundedRect(left, y, contentWidth, height, 14).fillAndStroke(fill, colors.border);
    };

    const labelStyle = { width: contentWidth - 48, align: "left" };

    doc.rect(0, 0, pageWidth, 104).fill(colors.navy);
    doc.fillColor("#ffffff");
    doc.font("Helvetica-Bold").fontSize(22).text(
      companySettings?.companyName || "IICPA Institute",
      left,
      28
    );
    doc.font("Helvetica").fontSize(11).text("Booking Invoice", left, 60);

    const badgeWidth = 156;
    doc.roundedRect(right - badgeWidth, 28, badgeWidth, 48, 12).fill(colors.blue);
    doc.fillColor("#ffffff");
    doc.font("Helvetica").fontSize(8).text("INVOICE NO", right - badgeWidth + 12, 38, {
      width: badgeWidth - 24,
      align: "left",
    });
    doc.font("Helvetica-Bold").fontSize(13).text(invoiceNumber, right - badgeWidth + 12, 52, {
      width: badgeWidth - 24,
      align: "left",
    });

    const drawField = (x, y, w, label, value) => {
      const valueText = value || "N/A";
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.muted).text(label, x, y, { width: w });
      const valueY = y + 12;
      doc.font("Helvetica").fontSize(10.5).fillColor(colors.navy).text(valueText, x, valueY, {
        width: w,
      });
      return valueY + doc.heightOfString(valueText, { width: w, align: "left" }) + 8;
    };

    let y = 128;

    // Billed By
    drawCard(y, 118);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.muted).text("BILLED BY", left + 18, y + 16);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(colors.navy).text(
      companySettings?.legalName || companySettings?.companyName || "IICPA Institute",
      left + 18,
      y + 36,
      { width: contentWidth - 36 }
    );
    let byY = y + 58;
    if (companyAddress) {
      doc.font("Helvetica").fontSize(10).fillColor(colors.slate).text(companyAddress, left + 18, byY, {
        width: contentWidth - 36,
      });
      byY += doc.heightOfString(companyAddress, { width: contentWidth - 36 }) + 4;
    }
    const companyLines = [
      companySettings?.gstin ? `GSTIN: ${companySettings.gstin}` : "",
      companySettings?.cin ? `CIN: ${companySettings.cin}` : "",
      companySettings?.pan ? `PAN: ${companySettings.pan}` : "",
      companySettings?.email ? `Email: ${companySettings.email}` : "",
      companySettings?.phone ? `Phone: ${companySettings.phone}` : "",
    ].filter(Boolean);
    companyLines.forEach((line) => {
      doc.font("Helvetica").fontSize(9.5).fillColor(colors.slate).text(line, left + 18, byY, {
        width: contentWidth - 36,
      });
      byY += 13;
    });

    // Invoice Details
    y += 132;
    drawCard(y, 142, colors.bg);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.muted).text("INVOICE DETAILS", left + 18, y + 16);
    const detailColWidth = (contentWidth - 54) / 2;
    const detailLeftX = left + 18;
    const detailRightX = left + 18 + detailColWidth + 18;
    let detailY = y + 38;
    const detailRows = [
      ["Student", booking?.studentId?.name || "Student"],
      ["Email", booking?.studentEmail || booking?.studentId?.email || "N/A"],
      ["Course / Package", booking?.itemTitle || "N/A"],
      ["Session Type", booking?.sessionType || "N/A"],
    ];
    detailY = drawField(detailLeftX, detailY, detailColWidth, detailRows[0][0], detailRows[0][1]);
    detailY = drawField(detailRightX, y + 38, detailColWidth, detailRows[1][0], detailRows[1][1]);
    detailY = drawField(detailLeftX, detailY + 4, detailColWidth, detailRows[2][0], detailRows[2][1]);
    drawField(detailRightX, detailY + 4, detailColWidth, detailRows[3][0], detailRows[3][1]);

    const statusLabel = paymentType === "Balance Payment" ? "BALANCE PAYMENT" : "BOOKING PAYMENT";
    const pillY = y + 18;
    const pillWidth = 120;
    const pillX = right - pillWidth - 18;
    doc.roundedRect(pillX, pillY, pillWidth, 24, 12).fill(
      paymentType === "Balance Payment" ? colors.softAmber : colors.softGreen
    );
    doc.fillColor(paymentType === "Balance Payment" ? colors.amber : colors.green);
    doc.font("Helvetica-Bold").fontSize(8.5).text(statusLabel, pillX, pillY + 7, {
      width: pillWidth,
      align: "center",
    });

    // Booking Summary
    y += 158;
    drawCard(y, 118);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.muted).text("BOOKING SUMMARY", left + 18, y + 16);
    const summaryLeft = [
      ["Item Type", itemTypeLabel],
      ["Payment Type", paymentType],
      ["Payment Date", formatDateTime(payment?.paidAt || new Date())],
    ];
    const summaryRight = [
      ["Razorpay Order ID", payment?.razorpayOrderId || "N/A"],
      ["Razorpay Payment ID", payment?.razorpayPaymentId || "N/A"],
      ["Remaining Balance", formatRupees(booking?.remainingAmount)],
    ];
    let summaryLeftY = y + 40;
    let summaryRightY = y + 40;
    summaryLeft.forEach(([label, value]) => {
      summaryLeftY = drawField(left + 18, summaryLeftY, detailColWidth, label, value);
    });
    summaryRight.forEach(([label, value]) => {
      summaryRightY = drawField(detailRightX, summaryRightY, detailColWidth, label, value);
    });

    // Amounts
    y += 136;
    drawCard(y, 166, "#ffffff");
    doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.muted).text("AMOUNTS", left + 18, y + 16);
    const amountRows = [
      ["Base Amount", formatRupees(booking?.baseAmount)],
      ["Booking Percent", `${Number(booking?.bookingPercent || 0).toFixed(2)}%`],
      ["Required Booking Amount", formatRupees(booking?.bookingAmount)],
      [`${paymentType} (Current Transaction)`, formatRupees(payment?.amount || 0)],
      ["Total Paid", formatRupees(booking?.paidAmount)],
    ];

    const amountLeftX = left + 18;
    const amountRightX = right - 170;
    let amountY = y + 40;
    amountRows.forEach(([label, value], index) => {
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(colors.slate).text(label, amountLeftX, amountY, {
        width: contentWidth - 220,
      });
      doc.font("Helvetica-Bold").fontSize(11).fillColor(index >= 3 ? colors.green : colors.navy).text(value, amountRightX, amountY, {
        width: 150,
        align: "right",
      });
      amountY += 23;
    });

    const remainingBoxY = y + 138;
    doc.roundedRect(left + 18, remainingBoxY, contentWidth - 36, 34, 10).fill(colors.softBlue);
    doc.fillColor(colors.blue);
    doc.font("Helvetica-Bold").fontSize(10.5).text("Remaining Balance", left + 32, remainingBoxY + 10);
    doc.font("Helvetica-Bold").fontSize(14).text(formatRupees(booking?.remainingAmount), right - 170, remainingBoxY + 8, {
      width: 150,
      align: "right",
    });

    // Notes
    if (companySettings?.invoiceNotes) {
      y += 180;
      drawCard(y, 70);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.muted).text("NOTES", left + 18, y + 16);
      doc.font("Helvetica").fontSize(10).fillColor(colors.slate).text(companySettings.invoiceNotes, left + 18, y + 34, {
        width: contentWidth - 36,
      });
    }

    const footerY = pageHeight - 58;
    doc.moveTo(left, footerY).lineTo(right, footerY).strokeColor(colors.border).stroke();
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.muted).text(
      "This invoice confirms the payment and enrollment for the selected session.",
      left,
      footerY + 12,
      { width: contentWidth, align: "center" }
    );

    doc.end();
  });

export const generateBookingInvoicePDF = async (booking, payment = null) => {
  let companySettings = null;
  try {
    companySettings = await InvoiceCompanySettings.getSettings();
  } catch (error) {
    companySettings = null;
  }

  const invoicePrefix =
    String(companySettings?.invoicePrefix || "BK").trim().toUpperCase() || "BK";
  const invoiceNumber = `${invoicePrefix}-${String(booking?._id || "")
    .slice(-8)
    .toUpperCase()}`;
  const paymentAmount = Number(payment?.amount || 0);
  const paymentType = payment?.paymentType === "balance" ? "Balance Payment" : "Booking Payment";
  const itemTypeLabel =
    booking?.itemType === "group_package" ? "Group Package" : "Single Course";
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
    companySettings?.legalName,
    companyAddress,
    companySettings?.gstin ? `GSTIN: ${companySettings.gstin}` : "",
    companySettings?.cin ? `CIN: ${companySettings.cin}` : "",
    companySettings?.pan ? `PAN: ${companySettings.pan}` : "",
    companySettings?.email ? `Email: ${companySettings.email}` : "",
    companySettings?.phone ? `Phone: ${companySettings.phone}` : "",
    companySettings?.website ? `Website: ${companySettings.website}` : "",
  ].filter((line) => String(line || "").trim() !== "");
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Booking Invoice</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #eef2f7;
          }
          .sheet {
            max-width: 920px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
            border: 1px solid #dbe3ee;
          }
          .hero {
            padding: 28px 32px;
            background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #059669 100%);
            color: white;
            position: relative;
          }
          .eyebrow {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            opacity: 0.85;
            margin-bottom: 8px;
          }
          .hero h1 { margin: 0; font-size: 30px; line-height: 1.1; }
          .hero-sub {
            margin-top: 10px;
            font-size: 14px;
            opacity: 0.95;
          }
          .badge {
            position: absolute;
            right: 32px;
            top: 28px;
            background: rgba(255,255,255,0.14);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 999px;
            padding: 12px 16px;
            min-width: 180px;
            text-align: right;
            backdrop-filter: blur(10px);
          }
          .badge small {
            display: block;
            font-size: 11px;
            opacity: 0.8;
            letter-spacing: 0.08em;
          }
          .badge strong {
            display: block;
            margin-top: 4px;
            font-size: 18px;
          }
          .content { padding: 28px 32px 32px; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
          .card {
            border: 1px solid #dbe3ee;
            border-radius: 18px;
            background: #fff;
            padding: 18px;
          }
          .card.soft {
            background: #f8fafc;
          }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 14px;
          }
          .company-name {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .muted {
            color: #64748b;
            font-size: 13px;
            line-height: 1.55;
          }
          .mini {
            font-size: 12px;
            color: #475569;
            margin: 3px 0;
          }
          .pill {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          .pill.green { background: #ecfdf5; color: #059669; }
          .pill.amber { background: #fffbeb; color: #f59e0b; }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .field {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px 14px;
            min-height: 72px;
          }
          .field .label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
            margin-bottom: 6px;
          }
          .field .value {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            word-break: break-word;
          }
          .amount-card { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #dbe3ee; border-radius: 18px; padding: 18px; }
          .amount-rows {
            margin-top: 8px;
          }
          .amount-row { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #eef2f7; font-size: 14px; }
          .amount-row:last-child {
            border-bottom: none;
          }
          .amount-row strong {
            color: #0f172a;
          }
          .amount-row span {
            color: #334155;
            font-weight: 600;
            text-align: right;
          }
          .highlight { margin-top: 14px; background: linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%); border: 1px solid #cbd5e1; border-radius: 14px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
          .highlight small {
            display: block;
            color: #2563eb;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
          }
          .highlight strong {
            font-size: 18px;
            color: #0f172a;
          }
          .footer {
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="hero">
            <div class="eyebrow">Enrollment Invoice</div>
            <h1>${escapeHtml(companySettings?.companyName || "IICPA Institute")}</h1>
            <div class="hero-sub">Booking invoice for live and recorded session enrollments</div>
            <div class="badge">
              <small>Invoice No</small>
              <strong>${escapeHtml(invoiceNumber)}</strong>
            </div>
          </div>
          <div class="content">
            <div class="grid2">
              <div class="card">
                <div class="section-title">Billed By</div>
                <div class="company-name">${escapeHtml(companySettings?.legalName || companySettings?.companyName || "IICPA Institute")}</div>
                ${companyAddress ? `<div class="muted">${escapeHtml(companyAddress)}</div>` : ""}
                <div style="margin-top: 10px;">
                  ${companyLines
                    .filter((line) => line)
                    .map((line) => `<div class="mini">${escapeHtml(line)}</div>`)
                    .join("")}
                </div>
              </div>
              <div class="card soft">
                <div class="section-title">Invoice Details</div>
                <span class="pill ${paymentType === "Balance Payment" ? "amber" : "green"}">${escapeHtml(paymentType)}</span>
                <div class="summary">
                  <div class="field">
                    <span class="label">Student</span>
                    <div class="value">${escapeHtml(booking?.studentId?.name || "Student")}</div>
                  </div>
                  <div class="field">
                    <span class="label">Email</span>
                    <div class="value">${escapeHtml(booking?.studentEmail || booking?.studentId?.email || "N/A")}</div>
                  </div>
                  <div class="field">
                    <span class="label">Course / Package</span>
                    <div class="value">${escapeHtml(booking?.itemTitle || "N/A")}</div>
                  </div>
                  <div class="field">
                    <span class="label">Session Type</span>
                    <div class="value">${escapeHtml(booking?.sessionType || "N/A")}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 16px;">
              <div class="section-title">Booking Summary</div>
              <div class="summary">
                <div class="field"><span class="label">Item Type</span><div class="value">${escapeHtml(itemTypeLabel)}</div></div>
                <div class="field"><span class="label">Payment Date</span><div class="value">${escapeHtml(formatDateTime(payment?.paidAt || new Date()))}</div></div>
                <div class="field"><span class="label">Razorpay Order ID</span><div class="value">${escapeHtml(payment?.razorpayOrderId || "N/A")}</div></div>
                <div class="field"><span class="label">Razorpay Payment ID</span><div class="value">${escapeHtml(payment?.razorpayPaymentId || "N/A")}</div></div>
                <div class="field"><span class="label">Payment Status</span><div class="value">${escapeHtml(booking?.paymentStatus || "N/A")}</div></div>
                <div class="field"><span class="label">Remaining Balance</span><div class="value">${escapeHtml(formatCurrency(booking?.remainingAmount))}</div></div>
              </div>
            </div>

            <div class="amount-card">
              <div class="section-title">Amounts</div>
              <div class="amount-rows">
                <div class="amount-row"><strong>Base Amount</strong><span>${escapeHtml(formatCurrency(booking?.baseAmount))}</span></div>
                <div class="amount-row"><strong>Booking Percent</strong><span>${escapeHtml(Number(booking?.bookingPercent || 0).toFixed(2))}%</span></div>
                <div class="amount-row"><strong>Required Booking Amount</strong><span>${escapeHtml(formatRupees(booking?.bookingAmount))}</span></div>
                <div class="amount-row"><strong>${escapeHtml(paymentType)} (Current Transaction)</strong><span>${escapeHtml(formatRupees(paymentAmount))}</span></div>
                <div class="amount-row"><strong>Total Paid</strong><span style="color:#059669">${escapeHtml(formatRupees(booking?.paidAmount))}</span></div>
              </div>
              <div class="highlight">
                <div>
                  <small>Remaining Balance</small>
                  <strong>${escapeHtml(formatRupees(booking?.remainingAmount))}</strong>
                </div>
                <div class="muted" style="text-align:right; max-width: 280px;">
                  Keep this invoice for your records and future reference.
                </div>
              </div>
            </div>

            ${
              companySettings?.invoiceNotes
                ? `<div class="card" style="margin-top:16px;">
                    <div class="section-title">Notes</div>
                    <div class="muted">${escapeHtml(companySettings.invoiceNotes)}</div>
                  </div>`
                : ""
            }

            <div class="footer">
              This invoice confirms the payment and enrollment for the selected session.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    return page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
    });
  } catch (browserError) {
    console.error("Puppeteer invoice generation failed, using PDFKit fallback:", browserError.message);
    return generateFallbackInvoicePDF({
      booking,
      payment,
      invoiceNumber,
      paymentType,
      itemTypeLabel,
      companySettings,
      companyAddress,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
