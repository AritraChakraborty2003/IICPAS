import puppeteer from "puppeteer";

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

export const generateBookingInvoicePDF = async (booking, payment = null) => {
  const invoiceNumber = `BK-${String(booking?._id || "").slice(-8).toUpperCase()}`;
  const paymentAmount = Number(payment?.amount || 0);
  const paymentType = payment?.paymentType === "balance" ? "Balance Payment" : "Booking Payment";
  const itemTypeLabel =
    booking?.itemType === "group_package" ? "Group Package" : "Single Course";
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
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>IICPA Booking Invoice</h1>
            <p>Invoice ${escapeHtml(invoiceNumber)}</p>
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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
