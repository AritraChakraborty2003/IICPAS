import axios from "axios";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppRecipient,
  whatsappConfig,
} from "../config/whatsappConfig.js";

const buildWhatsAppTemplatePayload = ({
  to,
  templateName,
  languageCode = whatsappConfig.templateLanguage,
  bodyParameters = [],
}) => ({
  messaging_product: "whatsapp",
  to,
  type: "template",
  template: {
    name: templateName,
    language: {
      code: languageCode,
    },
    components: bodyParameters.length
      ? [
          {
            type: "body",
            parameters: bodyParameters,
          },
        ]
      : [],
  },
});

export const sendWhatsAppTemplateMessage = async ({
  to,
  templateName,
  languageCode,
  bodyParameters = [],
}) => {
  if (!isWhatsAppConfigured()) {
    return {
      skipped: true,
      reason: "WhatsApp is not configured",
    };
  }

  const recipient = normalizeWhatsAppRecipient(to);
  if (!recipient) {
    throw new Error("Recipient phone number is required for WhatsApp message");
  }

  if (!templateName) {
    throw new Error("WhatsApp template name is required");
  }

  const payload = buildWhatsAppTemplatePayload({
    to: recipient,
    templateName,
    languageCode,
    bodyParameters,
  });

  const url = `https://graph.facebook.com/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${whatsappConfig.accessToken}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  return response.data;
};
