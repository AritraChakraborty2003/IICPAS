import crypto from "crypto";

const getVaultKey = () => {
  const rawKey =
    process.env.BULK_EMAIL_ENCRYPTION_KEY ||
    process.env.EMAIL_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "iicpa-bulk-email-dev-key";

  return crypto.createHash("sha256").update(String(rawKey)).digest();
};

export const encryptSecret = (value) => {
  const plainText = String(value || "");
  if (!plainText) return "";

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getVaultKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
};

export const decryptSecret = (value) => {
  const payload = String(value || "");
  if (!payload) return "";

  const [ivBase64, authTagBase64, encryptedBase64] = payload.split(":");
  if (!ivBase64 || !authTagBase64 || !encryptedBase64) return "";

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getVaultKey(),
    Buffer.from(ivBase64, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
