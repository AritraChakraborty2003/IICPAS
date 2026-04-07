import nodemailer from "nodemailer";
import {
  emailConfig,
  isEmailConfigured,
  setupEmailInstructions,
} from "../config/emailConfig.js";

const createTransporter = () => nodemailer.createTransport(emailConfig);

export const sendLiveSessionReceiptEmail = async (booking, pdfBuffer) => {
  const studentEmail = booking?.by;
  const studentName = booking?.requesterName || "Student";
  const sessionTitle = booking?.title || "Live Session";
  const invoiceLabel = `LS-INV-${String(booking?._id || "").slice(-8).toUpperCase()}`;

  if (!studentEmail) {
    throw new Error("Booking email is required to send live session receipt");
  }

  if (!isEmailConfigured()) {
    setupEmailInstructions();
    return {
      success: true,
      emailSent: false,
      email: studentEmail,
      messageId: `simulated-${Date.now()}`,
      message: "Email not configured - simulated send",
    };
  }

  const transporter = createTransporter();
  await transporter.verify();

  const info = await transporter.sendMail({
    from: {
      name: "IICPA Institute",
      address: emailConfig.auth.user,
    },
    to: studentEmail,
    subject: `Live Session Enrollment Invoice - ${sessionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #16a34a, #2563eb); color: #fff; padding: 18px;">
          <h2 style="margin:0;">Live Session Enrollment Confirmed</h2>
        </div>
        <div style="padding: 18px; background: #f8fafc;">
          <p>Hi ${studentName},</p>
          <p>Your enrollment for <strong>${sessionTitle}</strong> has been confirmed successfully.</p>
          <p>Your invoice is attached to this email as a PDF for your records.</p>
          <p><strong>Invoice No:</strong> ${invoiceLabel}</p>
          <p style="margin-top: 20px;">Thank you,<br/>IICPA Institute</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Live-Session-Invoice-${String(booking?._id || "").slice(-8)}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    success: true,
    email: studentEmail,
    messageId: info.messageId,
  };
};
