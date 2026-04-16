const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";

export const whatsappConfig = {
  apiVersion: process.env.WHATSAPP_API_VERSION || "v20.0",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  wabaId: process.env.WHATSAPP_WABA_ID || "",
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
  defaultCountryCode: DEFAULT_COUNTRY_CODE,
};

export const isWhatsAppConfigured = () =>
  Boolean(
    whatsappConfig.phoneNumberId &&
      whatsappConfig.accessToken
  );

export const normalizeWhatsAppRecipient = (
  value,
  defaultCountryCode = whatsappConfig.defaultCountryCode
) => {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .trim();

  if (!digits) return "";

  if (digits.length === 10 && defaultCountryCode) {
    return `${defaultCountryCode}${digits}`;
  }

  return digits;
};
