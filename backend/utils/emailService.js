import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import {
  emailConfig,
  isEmailConfigured,
  setupEmailInstructions,
} from "../config/emailConfig.js";

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};

const generateEmergencyInvoicePDF = async (transaction) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const invoiceId =
        transaction?._id?.toString()?.slice(-8)?.toUpperCase() || "N/A";
      const studentName = transaction?.studentId?.name || "Student";
      const studentEmail = transaction?.studentId?.email || "N/A";
      const courseName = transaction?.courseId?.title || "Course";
      const amount = Number(transaction?.amount || 0).toLocaleString("en-IN");
      const issuedAt = new Date().toLocaleString("en-IN");

      doc.fontSize(20).text("IICPA Private limited", { align: "center" });
      doc.moveDown(0.4);
      doc.fontSize(14).text("Course Invoice", { align: "center" });
      doc.moveDown(1.2);

      doc.fontSize(11).text(`Invoice ID: ${invoiceId}`);
      doc.text(`Date: ${issuedAt}`);
      doc.moveDown();
      doc.text(`Student: ${studentName}`);
      doc.text(`Email: ${studentEmail}`);
      doc.moveDown();
      doc.text(`Course: ${courseName}`);
      doc.text(`Amount Paid: Rs. ${amount}`);
      doc.text("Status: Paid");
      doc.moveDown(1.5);
      doc
        .fontSize(10)
        .fillColor("#555555")
        .text(
          "This is a system-generated invoice and does not require a physical signature."
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });

// Send invoice email with PDF attachment
export const sendReceiptEmail = async (transaction, pdfBuffer = null) => {
  try {
    // Check if email is properly configured
    if (!isEmailConfigured()) {
      console.warn(
        "Email not properly configured. Showing setup instructions..."
      );
      setupEmailInstructions();

      // For development/testing, just mark as sent without actually sending
      return {
        success: true,
        emailSent: false,
        email: transaction.studentId?.email,
        messageId: "simulated-" + Date.now(),
        message: "Email not configured - simulated send for development",
      };
    }

    const transporter = createTransporter();

    // Test email configuration
    await transporter.verify();

    const studentName = transaction.studentId?.name || "Student";
    const studentEmail = transaction.studentId?.email;
    const courseName = transaction.courseId?.title || "Course";
    const amount = transaction.amount;

    if (!studentEmail) {
      throw new Error("Student email not found");
    }

    let attachmentPdf = pdfBuffer;
    if (!attachmentPdf || !attachmentPdf.length) {
      attachmentPdf = await generateEmergencyInvoicePDF(transaction);
    }

    const hasPdfAttachment = Boolean(
      attachmentPdf && (Buffer.isBuffer(attachmentPdf) || attachmentPdf?.length)
    );

    const mailOptions = {
      from: {
        name: "IICPA Private limited",
        address: emailConfig.auth.user,
      },
      to: studentEmail,
      subject: `Invoice - Rs. ${amount?.toLocaleString(
        "en-IN"
      )} - ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0f172a; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">IICPA Private limited</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px;">Course Purchase Invoice</p>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #0f172a; margin-bottom: 15px;">Dear ${studentName},</h2>
            
            <p>Thank you for choosing IICPA. Your payment for <strong>${courseName}</strong> has been successfully processed.</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #0f172a;">
              <p style="margin: 0; font-size: 14px;"><strong>Invoice Details:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 18px; color: #0f172a; font-weight: bold;">
                Amount Paid: Rs. ${amount?.toLocaleString("en-IN") || "N/A"}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                Transaction ID: ${transaction._id.toString().slice(-8).toUpperCase()}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                Status: <span style="color: #28a745; font-weight: bold;">Paid</span>
              </p>
            </div>
            
            <p>Your payment has been successfully confirmed.</p>
            
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 0; font-size: 14px; color: #475569;">
                <strong>📋 Important:</strong> This invoice serves as proof of enrollment. Please keep it safe for future reference.
              </p>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Support Contact:</strong><br>
                Email: support@iicpa.org<br>
                Website: www.iicpa.org
              </p>
            </div>
          </div>
          
          <div style="background: #0f172a; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} IICPA Private limited. All rights reserved.</p>
          </div>
        </div>
      `,
      ...(hasPdfAttachment
        ? {
            attachments: [
              {
                filename: `Invoice-${transaction._id.toString().slice(-8).toUpperCase()}.pdf`,
                content: attachmentPdf,
                contentType: "application/pdf",
              },
            ],
          }
        : {}),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Invoice email sent successfully:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      email: studentEmail,
    };
  } catch (error) {
    console.error("Error sending receipt email:", error);
    throw error;
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("Email configuration is valid");
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
};
