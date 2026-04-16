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

const createInvoiceSignature = ({ transactionId, paymentId }) => {
  const secret = getInvoiceLinkSecret();
  if (!secret || !transactionId || !paymentId) {
    return "";
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${transactionId}:${paymentId}`)
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
  const token = createInvoiceSignature({ transactionId, paymentId });

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
}) => safeCompare(createInvoiceSignature({ transactionId, paymentId }), token);
