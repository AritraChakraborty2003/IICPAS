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

const shortRef = (value, head = 9, tail = 6) => {
  const text = String(value || "").trim();
  if (!text || text === "N/A") return "N/A";
  if (text.length <= head + tail + 3) return text;
  return `${text.slice(0, head)}...${text.slice(-tail)}`;
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

    doc.roundedRect(left, 18, contentWidth, 56, 10).fillAndStroke("#ffffff", colors.border);
    doc.fillColor(colors.navy);
    doc.font("Helvetica-Bold").fontSize(17).text(
      companySettings?.companyName || "IICPA Institute",
      left + 14,
      30
    );
    doc.font("Helvetica").fontSize(9).fillColor(colors.muted).text("Booking Invoice", left + 14, 50);

    const badgeWidth = 138;
    doc.roundedRect(right - badgeWidth - 14, 30, badgeWidth, 28, 8).fill("#f8fafc");
    doc.fillColor(colors.muted);
    doc.font("Helvetica").fontSize(7).text("INVOICE NO", right - badgeWidth, 36, {
      width: badgeWidth - 18,
      align: "right",
    });
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(colors.navy).text(invoiceNumber, right - badgeWidth, 46, {
      width: badgeWidth - 18,
      align: "right",
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

    let y = 90;

    // Billed By
    drawCard(y, 104);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.muted).text("BILLED BY", left + 16, y + 14);
    doc.font("Helvetica-Bold").fontSize(11.5).fillColor(colors.navy).text(
      companySettings?.legalName || companySettings?.companyName || "IICPA Institute",
      left + 16,
      y + 28,
      { width: contentWidth - 36 }
    );
    let byY = y + 44;
    if (companyAddress) {
      doc.font("Helvetica").fontSize(8.5).fillColor(colors.slate).text(companyAddress, left + 16, byY, {
        width: contentWidth - 36,
      });
      byY += doc.heightOfString(companyAddress, { width: contentWidth - 36 }) + 2;
    }
    const companyLines = [
      companySettings?.gstin ? `GSTIN: ${companySettings.gstin}` : "",
      companySettings?.cin ? `CIN: ${companySettings.cin}` : "",
      companySettings?.pan ? `PAN: ${companySettings.pan}` : "",
      companySettings?.email ? `Email: ${companySettings.email}` : "",
      companySettings?.phone ? `Phone: ${companySettings.phone}` : "",
    ].filter(Boolean);
    companyLines.forEach((line) => {
      doc.font("Helvetica").fontSize(8).fillColor(colors.slate).text(line, left + 16, byY, {
        width: contentWidth - 36,
      });
      byY += 10.5;
    });

    // Invoice Details
    y += 114;
    drawCard(y, 128, colors.bg);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.muted).text("INVOICE DETAILS", left + 16, y + 12);
    const detailColWidth = (contentWidth - 50) / 2;
    const detailLeftX = left + 16;
    const detailRightX = left + 16 + detailColWidth + 14;
    let detailY = y + 30;
    const detailRows = [
      ["Student", booking?.studentId?.name || "Student"],
      ["Email", booking?.studentEmail || booking?.studentId?.email || "N/A"],
      ["Course / Package", booking?.itemTitle || "N/A"],
      ["Session Type", booking?.sessionType || "N/A"],
    ];
    detailY = drawField(detailLeftX, detailY, detailColWidth, detailRows[0][0], detailRows[0][1]);
    detailY = drawField(detailRightX, y + 30, detailColWidth, detailRows[1][0], detailRows[1][1]);
    detailY = drawField(detailLeftX, detailY + 2, detailColWidth, detailRows[2][0], detailRows[2][1]);
    drawField(detailRightX, detailY + 2, detailColWidth, detailRows[3][0], detailRows[3][1]);

    const statusLabel = paymentType === "Balance Payment" ? "BALANCE PAYMENT" : "BOOKING PAYMENT";
    const pillY = y + 14;
    const pillWidth = 112;
    const pillX = right - pillWidth - 16;
    doc.roundedRect(pillX, pillY, pillWidth, 24, 12).fill(
      paymentType === "Balance Payment" ? colors.softAmber : colors.softGreen
    );
    doc.fillColor(paymentType === "Balance Payment" ? colors.amber : colors.green);
    doc.font("Helvetica-Bold").fontSize(7.5).text(statusLabel, pillX, pillY + 7, {
      width: pillWidth,
      align: "center",
    });

    // Booking Summary
    y += 134;
    drawCard(y, 104);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.muted).text("BOOKING SUMMARY", left + 16, y + 12);
    const summaryLeft = [
      ["Item Type", itemTypeLabel],
      ["Payment Type", paymentType],
      ["Payment Date", formatDateTime(payment?.paidAt || new Date())],
    ];
    const summaryRight = [
      ["Razorpay Order ID", shortRef(payment?.razorpayOrderId || "N/A")],
      ["Razorpay Payment ID", shortRef(payment?.razorpayPaymentId || "N/A")],
      ["Remaining Balance", formatRupees(booking?.remainingAmount)],
    ];
    let summaryLeftY = y + 28;
    let summaryRightY = y + 28;
    summaryLeft.forEach(([label, value]) => {
      summaryLeftY = drawField(left + 16, summaryLeftY, detailColWidth, label, value);
    });
    summaryRight.forEach(([label, value]) => {
      summaryRightY = drawField(detailRightX, summaryRightY, detailColWidth, label, value);
    });

    // Amounts
    y += 118;
    drawCard(y, 132, "#ffffff");
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.muted).text("AMOUNTS", left + 16, y + 12);
    const amountRows = [
      ["Base Amount", formatRupees(booking?.baseAmount)],
      ["Booking Percent", `${Number(booking?.bookingPercent || 0).toFixed(2)}%`],
      ["Required Booking Amount", formatRupees(booking?.bookingAmount)],
      [`${paymentType} (Current Transaction)`, formatRupees(payment?.amount || 0)],
      ["Total Paid", formatRupees(booking?.paidAmount)],
    ];

    const amountLeftX = left + 16;
    const amountRightX = right - 155;
    let amountY = y + 30;
    amountRows.forEach(([label, value], index) => {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.slate).text(label, amountLeftX, amountY, {
        width: contentWidth - 195,
      });
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(index >= 3 ? colors.green : colors.navy).text(value, amountRightX, amountY, {
        width: 150,
        align: "right",
      });
      amountY += 18;
    });

    const remainingBoxY = y + 110;
    doc.roundedRect(left + 16, remainingBoxY, contentWidth - 32, 28, 8).fill(colors.softBlue);
    doc.fillColor(colors.blue);
    doc.font("Helvetica-Bold").fontSize(9).text("Remaining Balance", left + 28, remainingBoxY + 8);
    doc.font("Helvetica-Bold").fontSize(11).text(formatRupees(booking?.remainingAmount), right - 155, remainingBoxY + 6, {
      width: 150,
      align: "right",
    });
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text(
      "This invoice confirms the payment and enrollment for the selected session.",
      left,
      748,
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
            padding: 10px;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sheet {
            max-width: 790px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 0;
            overflow: hidden;
            border: 1px solid #dbe3ee;
          }
          .header {
            padding: 14px 18px 12px;
            border-bottom: 1px solid #dbe3ee;
            position: relative;
            background: #fff;
          }
          .eyebrow {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #64748b;
            margin-bottom: 4px;
          }
          .hero h1 {
            margin: 0;
            font-size: 16px;
            line-height: 1.15;
            color: #0f172a;
          }
          .badge {
            position: absolute;
            right: 18px;
            top: 14px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 6px 10px;
            min-width: 120px;
            text-align: right;
          }
          .badge small {
            display: block;
            font-size: 7px;
            color: #64748b;
            letter-spacing: 0.08em;
          }
          .badge strong {
            display: block;
            margin-top: 2px;
            font-size: 10px;
            color: #0f172a;
          }
          .content { padding: 14px 18px 16px; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
          .card {
            border: 1px solid #dbe3ee;
            border-radius: 10px;
            background: #fff;
            padding: 10px 12px;
          }
          .section-title {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 6px;
          }
          .company-name {
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 4px;
            color: #0f172a;
          }
          .muted {
            color: #64748b;
            font-size: 8px;
            line-height: 1.45;
          }
          .mini {
            font-size: 7px;
            color: #475569;
            margin: 1px 0;
          }
          .pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 7px;
            font-weight: 700;
            margin-bottom: 6px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            color: #334155;
          }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
          .field {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 5px 7px;
            min-height: 30px;
          }
          .field .label {
            display: block;
            font-size: 6px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
            margin-bottom: 2px;
          }
          .field .value {
            font-size: 7px;
            font-weight: 600;
            color: #0f172a;
            word-break: break-word;
            line-height: 1.15;
          }
          .amount-card { border: 1px solid #dbe3ee; border-radius: 10px; padding: 10px 12px; }
          .amount-rows { margin-top: 2px; }
          .amount-row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-bottom: 1px solid #eef2f7; font-size: 8px; }
          .amount-row:last-child { border-bottom: none; }
          .amount-row strong { color: #0f172a; font-weight: 700; }
          .amount-row span {
            color: #334155;
            font-weight: 600;
            text-align: right;
          }
          .highlight { margin-top: 6px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 9px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
          .highlight small {
            display: block;
            color: #64748b;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 2px;
          }
          .highlight strong {
            font-size: 10px;
            color: #0f172a;
          }
          .footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 7px;
            color: #64748b;
            text-align: center;
          }
          .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .stack + .stack { margin-top: 6px; }
          @page { size: A4; margin: 8mm; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="eyebrow">Enrollment Invoice</div>
            <h1>${escapeHtml(companySettings?.companyName || "IICPA Institute")} Booking Invoice</h1>
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
                <div style="margin-top: 6px;">
                  ${companyLines
                    .filter((line) => line)
                    .map((line) => `<div class="mini">${escapeHtml(line)}</div>`)
                    .join("")}
                </div>
              </div>
              <div class="card">
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

            <div class="card" style="margin-bottom: 10px;">
              <div class="section-title">Booking Summary</div>
              <div class="two-col">
                <div class="stack">
                  <div class="field"><span class="label">Item Type</span><div class="value">${escapeHtml(itemTypeLabel)}</div></div>
                  <div class="field stack"><span class="label">Razorpay Order ID</span><div class="value">${escapeHtml(shortRef(payment?.razorpayOrderId || "N/A"))}</div></div>
                  <div class="field stack"><span class="label">Payment Status</span><div class="value">${escapeHtml(booking?.paymentStatus || "N/A")}</div></div>
                </div>
                <div class="stack">
                  <div class="field"><span class="label">Payment Date</span><div class="value">${escapeHtml(formatDateTime(payment?.paidAt || new Date()))}</div></div>
                  <div class="field stack"><span class="label">Razorpay Payment ID</span><div class="value">${escapeHtml(shortRef(payment?.razorpayPaymentId || "N/A"))}</div></div>
                  <div class="field stack"><span class="label">Remaining Balance</span><div class="value">${escapeHtml(formatRupees(booking?.remainingAmount))}</div></div>
                </div>
              </div>
            </div>

            <div class="amount-card">
              <div class="section-title">Amounts</div>
              <div class="amount-rows">
                <div class="amount-row"><strong>Base Amount</strong><span>${escapeHtml(formatRupees(booking?.baseAmount))}</span></div>
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
                <div class="muted" style="text-align:right; max-width: 220px;">Keep this invoice for your records.</div>
              </div>
            </div>

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
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
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
