import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import InvoiceCompanySettings from "../models/InvoiceCompanySettings.js";

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
      margin: 36,
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
    const cardGap = 12;
    const halfWidth = (contentWidth - cardGap) / 2;
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

    const drawRoundedCard = (x, y, w, h, fill = "#fff", stroke = colors.border) => {
      doc.roundedRect(x, y, w, h, 12).fillAndStroke(fill, stroke);
    };

    const drawSectionTitle = (title, x, y) => {
      doc.fontSize(11).fillColor(colors.muted).text(title.toUpperCase(), x, y);
    };

    const drawValue = (label, value, x, y, width = halfWidth) => {
      doc.fontSize(8.5).fillColor(colors.muted).text(label, x, y, { width });
      doc.fontSize(10.5).fillColor(colors.navy).text(value || "N/A", x, y + 12, {
        width,
      });
    };

    doc.rect(0, 0, pageWidth, 98).fill(colors.navy);
    doc.fillColor("#ffffff");
    doc.fontSize(22).font("Helvetica-Bold").text(
      companySettings?.companyName || "IICPA Institute",
      left,
      28
    );
    doc.fontSize(11).font("Helvetica").text("Booking Invoice", left, 58);

    const badgeWidth = 150;
    doc.roundedRect(right - badgeWidth, 26, badgeWidth, 44, 10).fill(colors.blue);
    doc.fillColor("#ffffff");
    doc.fontSize(8).text("INVOICE NO", right - badgeWidth + 12, 36, {
      width: badgeWidth - 24,
      align: "left",
    });
    doc.fontSize(13).font("Helvetica-Bold").text(invoiceNumber, right - badgeWidth + 12, 49, {
      width: badgeWidth - 24,
      align: "left",
    });

    let y = 120;
    drawRoundedCard(left, y, halfWidth, 150, "#ffffff");
    drawRoundedCard(left + halfWidth + cardGap, y, halfWidth, 150, "#ffffff");

    doc.font("Helvetica-Bold");
    drawSectionTitle("Billed By", left + 18, y + 16);
    drawSectionTitle("Invoice Details", left + halfWidth + cardGap + 18, y + 16);

    doc.font("Helvetica").fillColor(colors.slate);
    let byY = y + 36;
    if (companySettings?.legalName) {
      doc.fontSize(11).text(companySettings.legalName, left + 18, byY, {
        width: halfWidth - 36,
      });
      byY += 16;
    }
    if (companyAddress) {
      doc.fontSize(9.5).fillColor(colors.muted).text(companyAddress, left + 18, byY, {
        width: halfWidth - 36,
      });
      byY += 28;
    }
    const companyDetails = [
      companySettings?.gstin ? `GSTIN: ${companySettings.gstin}` : "",
      companySettings?.cin ? `CIN: ${companySettings.cin}` : "",
      companySettings?.pan ? `PAN: ${companySettings.pan}` : "",
      companySettings?.email ? `Email: ${companySettings.email}` : "",
      companySettings?.phone ? `Phone: ${companySettings.phone}` : "",
    ].filter(Boolean);
    companyDetails.forEach((line) => {
      doc.fontSize(9.5).fillColor(colors.slate).text(line, left + 18, byY, {
        width: halfWidth - 36,
      });
      byY += 14;
    });

    const statusLabel = paymentType === "Balance Payment" ? "BALANCE" : "BOOKING";
    const statusFill = paymentType === "Balance Payment" ? colors.softAmber : colors.softGreen;
    doc.roundedRect(left + halfWidth + cardGap + 18, y + 38, 78, 22, 11).fill(statusFill);
    doc.fillColor(paymentType === "Balance Payment" ? colors.amber : colors.green);
    doc.fontSize(9).font("Helvetica-Bold").text(statusLabel, left + halfWidth + cardGap + 18, y + 45, {
      width: 78,
      align: "center",
    });

    const infoStartX = left + halfWidth + cardGap + 18;
    const infoWidth = halfWidth - 36;
    drawValue("Student", booking?.studentId?.name || "Student", infoStartX, y + 74, infoWidth);
    drawValue(
      "Email",
      booking?.studentEmail || booking?.studentId?.email || "N/A",
      infoStartX + infoWidth / 2 + 6,
      y + 74,
      infoWidth / 2 - 6
    );
    drawValue("Course / Package", booking?.itemTitle || "N/A", infoStartX, y + 112, infoWidth);
    drawValue("Session Type", booking?.sessionType || "N/A", infoStartX + infoWidth / 2 + 6, y + 112, infoWidth / 2 - 6);

    y += 170;
    drawRoundedCard(left, y, contentWidth, 160, colors.bg);
    drawSectionTitle("Booking Summary", left + 18, y + 16);

    const summaryTop = y + 40;
    const summaryCols = 3;
    const summaryColWidth = (contentWidth - 36 - (summaryCols - 1) * 10) / summaryCols;

    const summaryFields = [
      ["Payment Type", paymentType],
      ["Payment Date", formatDateTime(payment?.paidAt || new Date())],
      ["Item Type", itemTypeLabel],
      ["Razorpay Order ID", payment?.razorpayOrderId || "N/A"],
      ["Razorpay Payment ID", payment?.razorpayPaymentId || "N/A"],
      ["Remaining", formatCurrency(booking?.remainingAmount)],
    ];

    summaryFields.forEach((field, index) => {
      const col = index % summaryCols;
      const row = Math.floor(index / summaryCols);
      const x = left + 18 + col * (summaryColWidth + 10);
      const fieldY = summaryTop + row * 40;
      drawValue(field[0], field[1], x, fieldY, summaryColWidth);
    });

    y += 184;
    drawRoundedCard(left, y, contentWidth, 184, "#ffffff");
    drawSectionTitle("Amounts", left + 18, y + 16);

    const amountRows = [
      ["Base Amount", formatCurrency(booking?.baseAmount)],
      ["Booking Percent", `${Number(booking?.bookingPercent || 0).toFixed(2)}%`],
      ["Required Booking Amount", formatCurrency(booking?.bookingAmount)],
      [`${paymentType} (Current Transaction)`, formatCurrency(payment?.amount || 0)],
      ["Total Paid", formatCurrency(booking?.paidAmount)],
    ];

    const amountStartY = y + 42;
    amountRows.forEach((row, index) => {
      const rowY = amountStartY + index * 22;
      doc.fontSize(10.5).fillColor(colors.muted).text(row[0], left + 18, rowY, {
        width: contentWidth - 120,
      });
      doc.fontSize(11).fillColor(index === 3 || index === 4 ? colors.green : colors.navy).font("Helvetica-Bold").text(row[1], right - 108, rowY, {
        width: 90,
        align: "right",
      });
    });

    const remainingLabelY = amountStartY + amountRows.length * 22 + 6;
    doc.roundedRect(left + 18, remainingLabelY, contentWidth - 36, 38, 10).fill(colors.softBlue);
    doc.fillColor(colors.blue);
    doc.fontSize(10).font("Helvetica-Bold").text("Remaining Balance", left + 32, remainingLabelY + 12);
    doc.fontSize(14).text(formatCurrency(booking?.remainingAmount), right - 140, remainingLabelY + 9, {
      width: 120,
      align: "right",
    });

    if (companySettings?.invoiceNotes) {
      y += 202;
      drawRoundedCard(left, y, contentWidth, 74, "#ffffff");
      drawSectionTitle("Notes", left + 18, y + 16);
      doc.fontSize(10).fillColor(colors.slate).text(companySettings.invoiceNotes, left + 18, y + 36, {
        width: contentWidth - 36,
      });
    }

    const footerY = pageHeight - 72;
    doc.moveTo(left, footerY).lineTo(right, footerY).strokeColor(colors.border).stroke();
    doc.fontSize(8.5).fillColor(colors.muted).text(
      "This invoice confirms the live session booking payment. Keep this document for your records.",
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
            font-family: Inter, Arial, sans-serif;
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
          .hero h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1.1;
          }
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
          .content {
            padding: 28px 32px 32px;
          }
          .grid2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 18px;
          }
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
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
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
          .amount-card {
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            border: 1px solid #dbe3ee;
            border-radius: 18px;
            padding: 18px;
          }
          .amount-rows {
            margin-top: 8px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 10px 0;
            border-bottom: 1px solid #eef2f7;
            font-size: 14px;
          }
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
          .highlight {
            margin-top: 14px;
            background: linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%);
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            padding: 14px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }
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
                <div class="summary" style="grid-template-columns: 1fr 1fr; gap: 10px;">
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
                <div class="amount-row"><strong>Required Booking Amount</strong><span>${escapeHtml(formatCurrency(booking?.bookingAmount))}</span></div>
                <div class="amount-row"><strong>${escapeHtml(paymentType)} (Current Transaction)</strong><span>${escapeHtml(formatCurrency(paymentAmount))}</span></div>
                <div class="amount-row"><strong>Total Paid</strong><span style="color:#059669">${escapeHtml(formatCurrency(booking?.paidAmount))}</span></div>
              </div>
              <div class="highlight">
                <div>
                  <small>Remaining Balance</small>
                  <strong>${escapeHtml(formatCurrency(booking?.remainingAmount))}</strong>
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
