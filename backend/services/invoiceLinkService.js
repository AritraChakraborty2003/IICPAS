import crypto from "crypto";

const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

export const resolveApiBaseUrl = () => {
  const explicitApiBaseUrl = normalizeBaseUrl(
    process.env.API_BASE_URL || process.env.PUBLIC_API_BASE_URL || ""
  );

  if (explicitApiBaseUrl) {
    return explicitApiBaseUrl;
  }

  const backendBaseUrl = normalizeBaseUrl(
    process.env.BASE_URL_BACKEND || process.env.BACKEND_URL || ""
  );

  if (!backendBaseUrl) {
    return "";
  }

  return backendBaseUrl.endsWith("/api")
    ? backendBaseUrl
    : `${backendBaseUrl}/api`;
};

const getInvoiceLinkSecret = () =>
  String(
    process.env.INVOICE_LINK_SECRET ||
      process.env.JWT_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      ""
  ).trim();

const createInvoiceSignature = ({ recordId, paymentId }) => {
  const secret = getInvoiceLinkSecret();
  if (!secret || !recordId || !paymentId) {
    return "";
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${recordId}:${paymentId}`)
    .digest("hex");
};

const safeCompare = (expected, provided) => {
  if (!expected || !provided) return false;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

export const buildTransactionInvoiceDownloadUrl = ({
  transactionId,
  paymentId,
  baseUrl = "",
}) => {
  const resolvedBaseUrl = normalizeBaseUrl(baseUrl) || resolveApiBaseUrl();
  const token = createInvoiceSignature({ recordId: transactionId, paymentId });

  if (!resolvedBaseUrl || !token || !transactionId || !paymentId) {
    return "";
  }

  return `${resolvedBaseUrl}/v1/payments/receipts/transaction/${encodeURIComponent(
    transactionId
  )}/download?paymentId=${encodeURIComponent(paymentId)}&token=${encodeURIComponent(
    token
  )}`;
};

export const verifyTransactionInvoiceDownloadToken = ({
  transactionId,
  paymentId,
  token,
}) => safeCompare(
  createInvoiceSignature({ recordId: transactionId, paymentId }),
  token
);

export const buildCourseBookingInvoiceDownloadUrl = ({
  bookingId,
  paymentId,
  baseUrl = "",
}) => {
  const resolvedBaseUrl = normalizeBaseUrl(baseUrl) || resolveApiBaseUrl();
  const token = createInvoiceSignature({ recordId: bookingId, paymentId });

  if (!resolvedBaseUrl || !token || !bookingId || !paymentId) {
    return "";
  }

  return `${resolvedBaseUrl}/v1/course-bookings/public/${encodeURIComponent(
    bookingId
  )}/invoice?paymentId=${encodeURIComponent(paymentId)}&token=${encodeURIComponent(
    token
  )}`;
};

export const verifyCourseBookingInvoiceDownloadToken = ({
  bookingId,
  paymentId,
  token,
}) => safeCompare(
  createInvoiceSignature({ recordId: bookingId, paymentId }),
  token
);

/**
 * For the generic Booking model (Live Session enrollments)
 */
export const buildBookingInvoiceDownloadUrl = ({
  bookingId,
  paymentId,
  baseUrl = "",
}) => {
  const resolvedBaseUrl = normalizeBaseUrl(baseUrl) || resolveApiBaseUrl();
  const token = createInvoiceSignature({ recordId: bookingId, paymentId });

  if (!resolvedBaseUrl || !token || !bookingId || !paymentId) {
    return "";
  }

  return `${resolvedBaseUrl}/v1/payments/receipts/booking/${encodeURIComponent(
    bookingId
  )}/download/public?paymentId=${encodeURIComponent(
    paymentId
  )}&token=${encodeURIComponent(token)}`;
};

export const verifyBookingInvoiceDownloadToken = ({
  bookingId,
  paymentId,
  token,
}) =>
  safeCompare(
    createInvoiceSignature({ recordId: bookingId, paymentId }),
    token
  );
