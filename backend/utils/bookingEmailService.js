import nodemailer from "nodemailer";
import {
  emailConfig,
  isEmailConfigured,
  setupEmailInstructions,
} from "../config/emailConfig.js";

const createTransporter = () => nodemailer.createTransport(emailConfig);

export const sendBookingInvoiceEmail = async (booking, pdfBuffer) => {
  const studentName = booking?.studentId?.name || "Student";
  const studentEmail = booking?.studentEmail || booking?.studentId?.email;
  const itemTitle = booking?.itemTitle || "Course";

  if (!studentEmail) {
    throw new Error("Student email not available for booking invoice");
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
    subject: `Booking Invoice - ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #059669, #0284c7); color: #fff; padding: 18px;">
          <h2 style="margin:0;">Booking Payment Confirmation</h2>
        </div>
        <div style="padding: 18px; background: #f8fafc;">
          <p>Hi ${studentName},</p>
          <p>Your payment for <strong>${itemTitle}</strong> has been recorded successfully.</p>
          <p>Please find your booking invoice attached as PDF.</p>
          <p style="margin-top: 20px;">Thank you,<br/>IICPA Institute</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Booking-Invoice-${String(booking?._id || "").slice(-8)}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    success: true,
    messageId: info.messageId,
    email: studentEmail,
  };
};
