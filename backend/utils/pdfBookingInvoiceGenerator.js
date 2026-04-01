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

    doc.fontSize(18).fillColor("#111827").text(
      `${companySettings?.companyName || "IICPA Institute"} Booking Invoice`,
      { align: "left" }
    );
    doc.moveDown(0.25);
    doc.fontSize(11).fillColor("#4B5563").text(`Invoice: ${invoiceNumber}`);
    doc.moveDown(0.6);

    doc.fontSize(12).fillColor("#111827").text("Billed By");
    if (companySettings?.legalName) {
      doc.fontSize(10).fillColor("#374151").text(companySettings.legalName);
    }
    if (companyAddress) {
      doc.fontSize(10).fillColor("#374151").text(companyAddress);
    }
    if (companySettings?.gstin) {
      doc.fontSize(10).fillColor("#374151").text(`GSTIN: ${companySettings.gstin}`);
    }
    if (companySettings?.cin) {
      doc.fontSize(10).fillColor("#374151").text(`CIN: ${companySettings.cin}`);
    }
    if (companySettings?.pan) {
      doc.fontSize(10).fillColor("#374151").text(`PAN: ${companySettings.pan}`);
    }
    if (companySettings?.email) {
      doc.fontSize(10).fillColor("#374151").text(`Email: ${companySettings.email}`);
    }
    if (companySettings?.phone) {
      doc.fontSize(10).fillColor("#374151").text(`Phone: ${companySettings.phone}`);
    }

    doc.moveDown(0.8);
    doc.fontSize(12).fillColor("#111827").text("Booking Details");
    doc.fontSize(10).fillColor("#374151").text(
      `Student: ${booking?.studentId?.name || "Student"}`
    );
    doc.text(
      `Student Email: ${booking?.studentEmail || booking?.studentId?.email || "N/A"}`
    );
    doc.text(`Item Type: ${itemTypeLabel}`);
    doc.text(`Course/Package: ${booking?.itemTitle || "N/A"}`);
    doc.text(`Session Type: ${booking?.sessionType || "N/A"}`);
    doc.text(`Payment Type: ${paymentType}`);
    doc.text(`Payment Date: ${formatDateTime(payment?.paidAt || new Date())}`);
    doc.text(`Razorpay Order ID: ${payment?.razorpayOrderId || "N/A"}`);
    doc.text(`Razorpay Payment ID: ${payment?.razorpayPaymentId || "N/A"}`);

    doc.moveDown(0.8);
    doc.fontSize(12).fillColor("#111827").text("Amounts");
    doc.fontSize(10).fillColor("#374151").text(
      `Base Amount: ${formatCurrency(booking?.baseAmount)}`
    );
    doc.text(
      `Booking Percent: ${Number(booking?.bookingPercent || 0).toFixed(2)}%`
    );
    doc.text(
      `Required Booking Amount: ${formatCurrency(booking?.bookingAmount)}`
    );
    doc.text(
      `${paymentType} (Current Transaction): ${formatCurrency(payment?.amount || 0)}`
    );
    doc.text(`Total Paid: ${formatCurrency(booking?.paidAmount)}`);
    doc.text(`Remaining: ${formatCurrency(booking?.remainingAmount)}`);

    if (companySettings?.invoiceNotes) {
      doc.moveDown(0.8);
      doc.fontSize(11).fillColor("#111827").text("Notes");
      doc.fontSize(10).fillColor("#374151").text(companySettings.invoiceNotes);
    }

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
          body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 20px; }
          .card { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
          .header { padding: 18px; background: linear-gradient(90deg, #059669, #0284c7); color: white; }
          .header h1 { margin: 0; font-size: 22px; }
          .header p { margin: 6px 0 0; font-size: 12px; opacity: 0.95; }
          .section { padding: 16px 18px; border-top: 1px solid #e5e7eb; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
          .label { font-size: 12px; color: #6b7280; }
          .value { font-size: 14px; font-weight: 600; color: #111827; }
          .totals { background: #f8fafc; border-radius: 8px; padding: 12px; }
          .totals-row { display: flex; justify-content: space-between; margin: 6px 0; }
          .muted { color: #6b7280; }
          .green { color: #047857; font-weight: 700; }
          .red { color: #b91c1c; font-weight: 700; }
          .small { font-size: 12px; color: #374151; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>${escapeHtml(companySettings?.companyName || "IICPA Institute")} Booking Invoice</h1>
            <p>Invoice ${escapeHtml(invoiceNumber)}</p>
          </div>
          <div class="section">
            <div class="label">Billed By</div>
            ${companyLines
              .map((line) => `<div class="small">${escapeHtml(line)}</div>`)
              .join("")}
          </div>
          <div class="section">
            <div class="grid">
              <div>
                <div class="label">Student</div>
                <div class="value">${escapeHtml(booking?.studentId?.name || "Student")}</div>
              </div>
              <div>
                <div class="label">Email</div>
                <div class="value">${escapeHtml(
                  booking?.studentEmail || booking?.studentId?.email || ""
                )}</div>
              </div>
              <div>
                <div class="label">Item Type</div>
                <div class="value">${escapeHtml(itemTypeLabel)}</div>
              </div>
              <div>
                <div class="label">Course/Package</div>
                <div class="value">${escapeHtml(booking?.itemTitle || "N/A")}</div>
              </div>
              <div>
                <div class="label">Session Type</div>
                <div class="value">${escapeHtml(booking?.sessionType || "N/A")}</div>
              </div>
              <div>
                <div class="label">Payment Date</div>
                <div class="value">${escapeHtml(formatDateTime(payment?.paidAt || new Date()))}</div>
              </div>
              <div>
                <div class="label">Razorpay Order ID</div>
                <div class="value">${escapeHtml(payment?.razorpayOrderId || "N/A")}</div>
              </div>
              <div>
                <div class="label">Razorpay Payment ID</div>
                <div class="value">${escapeHtml(payment?.razorpayPaymentId || "N/A")}</div>
              </div>
            </div>
          </div>
          <div class="section totals">
            <div class="totals-row"><span class="muted">Base Amount</span><span>${formatCurrency(
              booking?.baseAmount
            )}</span></div>
            <div class="totals-row"><span class="muted">Booking Percent</span><span>${
              Number(booking?.bookingPercent || 0).toFixed(2)
            }%</span></div>
            <div class="totals-row"><span class="muted">Required Booking Amount</span><span>${formatCurrency(
              booking?.bookingAmount
            )}</span></div>
            <div class="totals-row"><span class="muted">${escapeHtml(
              paymentType
            )} (Current Transaction)</span><span class="green">${formatCurrency(paymentAmount)}</span></div>
            <div class="totals-row"><span class="muted">Total Paid</span><span class="green">${formatCurrency(
              booking?.paidAmount
            )}</span></div>
            <div class="totals-row"><span class="muted">Remaining</span><span class="red">${formatCurrency(
              booking?.remainingAmount
            )}</span></div>
            ${
              companySettings?.invoiceNotes
                ? `<div style="margin-top:10px;" class="small"><strong>Notes:</strong> ${escapeHtml(
                    companySettings.invoiceNotes
                  )}</div>`
                : ""
            }
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
