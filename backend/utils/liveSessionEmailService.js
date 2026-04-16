import nodemailer from "nodemailer";
import {
  emailConfig,
  isEmailConfigured,
  setupEmailInstructions,
} from "../config/emailConfig.js";
import {
  formatReminderSendAtLabel,
  formatSessionScheduleLabel,
  normalizeJoinLink,
} from "./liveSessionReminderHelpers.js";

const createTransporter = () => nodemailer.createTransport(emailConfig);

const formatSessionDate = (value) => {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const sendLiveSessionReceiptEmail = async (booking, pdfBuffer) => {
  const studentEmail = booking?.by;
  const studentName = booking?.requesterName || "Student";
  const sessionTitle = booking?.title || "Live Session";
  const sessionJoinLink = String(
    booking?.link || booking?.liveSessionId?.link || ""
  ).trim();
  const sessionTime = String(
    booking?.time || booking?.liveSessionId?.time || ""
  ).trim();
  const sessionDate = formatSessionDate(booking?.date || booking?.liveSessionId?.date);
  const hasInvoiceAttachment = Boolean(pdfBuffer);
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
    subject: hasInvoiceAttachment
      ? `Live Session Enrollment Invoice - ${sessionTitle}`
      : `Live Session Enrollment Confirmed - ${sessionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #16a34a, #2563eb); color: #fff; padding: 18px;">
          <h2 style="margin:0;">Live Session Enrollment Confirmed</h2>
        </div>
        <div style="padding: 18px; background: #f8fafc;">
          <p>Hi ${studentName},</p>
          <p>Your enrollment for <strong>${sessionTitle}</strong> has been confirmed successfully.</p>
          ${
            sessionDate || sessionTime
              ? `<p><strong>Session Schedule:</strong> ${[sessionDate, sessionTime]
                  .filter(Boolean)
                  .join(" | ")}</p>`
              : ""
          }
          ${
            sessionJoinLink
              ? `<p><strong>Joining Link:</strong> <a href="${sessionJoinLink}" target="_blank" rel="noopener noreferrer">${sessionJoinLink}</a></p>`
              : ""
          }
          ${
            hasInvoiceAttachment
              ? `<p>Your invoice is attached to this email as a PDF for your records.</p>
                 <p><strong>Invoice No:</strong> ${invoiceLabel}</p>`
              : ""
          }
          <p style="margin-top: 20px;">Thank you,<br/>IICPA Institute</p>
        </div>
      </div>
    `,
    attachments: hasInvoiceAttachment
      ? [
          {
            filename: `Live-Session-Invoice-${String(booking?._id || "").slice(-8)}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : [],
  });

  return {
    success: true,
    email: studentEmail,
    messageId: info.messageId,
  };
};

export const sendLiveSessionReminderEmail = async ({
  recipientEmail,
  recipientName,
  session,
}) => {
  const studentEmail = String(recipientEmail || "").trim();
  const studentName = String(recipientName || "Student").trim() || "Student";
  const sessionTitle = session?.title || "Live Session";
  const sessionTimezone =
    session?.reminderSettings?.timezone || "Asia/Kolkata";
  const sessionSchedule = formatSessionScheduleLabel(
    {
      date: session?.date,
      time: session?.time,
    },
    sessionTimezone
  );
  const reminderSendAt = formatReminderSendAtLabel(
    session?.reminderSettings?.sendAt,
    sessionTimezone
  );
  const sessionJoinLink = normalizeJoinLink(session?.link || "");

  if (!studentEmail) {
    throw new Error("Reminder email requires a recipient email address");
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
    subject: `Reminder: ${sessionTitle} starts soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #0f172a, #2563eb); color: #fff; padding: 18px;">
          <h2 style="margin:0;">Live Session Reminder</h2>
        </div>
        <div style="padding: 18px; background: #f8fafc;">
          <p>Hi ${studentName},</p>
          <p>This is a reminder for your confirmed enrollment in <strong>${sessionTitle}</strong>.</p>
          ${
            sessionSchedule
              ? `<p><strong>Session Schedule:</strong> ${sessionSchedule}</p>`
              : ""
          }
          ${
            reminderSendAt
              ? `<p><strong>Reminder queued for:</strong> ${reminderSendAt}</p>`
              : ""
          }
          ${
            sessionJoinLink
              ? `<p><strong>Joining Link:</strong> <a href="${sessionJoinLink}" target="_blank" rel="noopener noreferrer">${sessionJoinLink}</a></p>`
              : ""
          }
          <p style="margin-top: 20px;">Please be ready a few minutes early.<br/>IICPA Institute</p>
        </div>
      </div>
    `,
  });

  return {
    success: true,
    email: studentEmail,
    messageId: info.messageId,
  };
};
