import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export const generateReceiptPDF = async (transaction) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${transaction._id.toString().slice(-8).toUpperCase()}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1e293b;
          font-size: 11pt;
          line-height: 1.5;
        }
        .invoice-container {
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 20px;
        }
        .company-logo-section {
          flex: 1;
        }
        .company-logo {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .company-tagline {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
          text-transform: lowercase;
        }
        .company-details {
          text-align: right;
          flex: 1;
        }
        .company-name {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .contact-info {
          font-size: 10px;
          color: #475569;
          line-height: 1.4;
        }
        .invoice-meta {
          display: flex;
          background: #f8fafc;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 30px;
          justify-content: space-between;
        }
        .meta-item {
          flex: 1;
        }
        .meta-label {
          font-size: 9px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .meta-value {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
        }
        .bill-to-section {
          margin-bottom: 30px;
        }
        .bill-to-label {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .customer-name {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .customer-details {
          font-size: 11px;
          color: #475569;
          margin-top: 4px;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .invoice-table th {
          background: #0f172a;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 12px 10px;
          text-align: left;
        }
        .invoice-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 11px;
        }
        .text-right { text-align: right; }
        .invoice-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
        }
        .terms-bank {
          flex: 2;
        }
        .totals-section {
          flex: 1;
          text-align: right;
        }
        .section-title {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 8px;
          border-bottom: 1px solid #f1f5f9;
          display: inline-block;
          padding-bottom: 2px;
        }
        .bank-info, .terms-text {
          font-size: 9px;
          color: #64748b;
          line-height: 1.6;
        }
        .total-row {
          display: flex;
          justify-content: flex-end;
          padding: 8px 0;
        }
        .total-label {
          font-size: 11px;
          color: #64748b;
          width: 120px;
        }
        .total-value {
          font-size: 11px;
          font-weight: 600;
          width: 100px;
        }
        .grand-total {
          border-top: 2px solid #0f172a;
          margin-top: 8px;
          padding-top: 8px;
        }
        .grand-total .total-label {
          font-weight: 700;
          color: #0f172a;
          font-size: 13px;
        }
        .grand-total .total-value {
          font-weight: 800;
          color: #0f172a;
          font-size: 13px;
        }
        .qr-section {
          text-align: center;
          margin-top: 20px;
        }
        .signature-section {
          text-align: right;
          margin-top: 40px;
          padding-top: 20px;
        }
        .signature-line {
          border-top: 1px solid #cbd5e1;
          width: 150px;
          float: right;
          margin-bottom: 5px;
        }
        .signature-label {
          font-size: 9px;
          color: #94a3b8;
          clear: both;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          background: #f1f5f9;
          color: #475569;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-logo-section">
            <div class="company-logo">IICPA</div>
            <div class="company-tagline">empowering future professionals</div>
          </div>
          <div class="company-details">
            <div class="company-name">IICPA Private limited</div>
            <div class="contact-info">
              SHOP NO 712-A, SEVENTH FLOOR, KASANA TOWER<br>
              ALPHA COMMERCIAL BELT, Greater Noida, UP, 201308<br>
              Website: www.iicpa.org | Email: support@iicpa.org
            </div>
          </div>
        </div>

        <div style="text-align: right; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 2px;">Invoice</h2>
          <div class="badge">Non-GST Registered</div>
        </div>

        <div class="invoice-meta">
          <div class="meta-item">
            <div class="meta-label">Invoice No</div>
            <div class="meta-value">INV-${transaction._id.toString().slice(-8).toUpperCase()}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Invoice Date</div>
            <div class="meta-value">${new Date(transaction.createdAt).toLocaleDateString("en-IN")}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Due Date</div>
            <div class="meta-value">${new Date(transaction.createdAt).toLocaleDateString("en-IN")}</div>
          </div>
        </div>

        <div class="bill-to-section">
          <div class="bill-to-label">Bill To</div>
          <div class="customer-name">${transaction.studentId?.name || "Student"}</div>
          <div class="customer-details">
            ${transaction.studentId?.email || ""}<br>
            ${transaction.billingAddress || "Online Course Purchase"}
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th width="5%">No</th>
              <th width="50%">Items</th>
              <th width="15%">Qty</th>
              <th width="15%">Price</th>
              <th width="15%" class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                <strong>${transaction.courseId?.title || "Professional Course"}</strong><br>
                <small style="color: #64748b">Session: ${
                  transaction.sessionType.charAt(0).toUpperCase() + transaction.sessionType.slice(1)
                }</small>
              </td>
              <td>1</td>
              <td>Rs. ${transaction.amount?.toLocaleString("en-IN")}</td>
              <td class="text-right">Rs. ${transaction.amount?.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        <div class="invoice-footer">
          <div class="terms-bank">
            <div class="section-title">Bank Details</div>
            <div class="bank-info">
              <strong>Account Name:</strong> IICPA Private limited<br>
              <strong>Bank:</strong> State Bank of India<br>
              <strong>A/c No:</strong> XXXXXXXXXXXX (Placeholder)<br>
              <strong>IFSC:</strong> SBIN00XXXXX
            </div>

            <div class="section-title" style="margin-top: 20px;">Terms & Conditions</div>
            <div class="terms-text">
              1. Payment is due at the time of purchase.<br>
              2. Goods once sold will not be returned or refunded.<br>
              3. This is a computer-generated invoice and doesn't require a physical signature.
            </div>
          </div>

          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">Rs. ${transaction.amount?.toLocaleString("en-IN")}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Tax (0%)</span>
              <span class="total-value">Rs. 0.00</span>
            </div>
            <div class="total-row grand-total">
              <span class="total-label">Grand Total</span>
              <span class="total-value">Rs. ${transaction.amount?.toLocaleString("en-IN")}</span>
            </div>
            
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-label">Authorized Signatory</div>
            </div>
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

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
