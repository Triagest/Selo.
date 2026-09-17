import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const fromNumber = process.env.TWILIO_PHONE_NUMBER || "";

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface NotificationParams {
  to: string;
  body: string;
}

/**
 * Send WhatsApp message via Twilio
 * Phone numbers must be in E.164 format: +55XXXXXXXXXX
 */
export async function sendWhatsAppNotification({
  to,
  body,
}: NotificationParams): Promise<boolean> {
  if (!twilioClient || !fromNumber) {
    console.warn(
      "WhatsApp not configured. Would send to",
      to,
      ":",
      body
    );
    return false;
  }

  try {
    await twilioClient.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${to}`,
      body,
    });

    console.log(`WhatsApp sent to ${to}`);
    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

/**
 * Notify first signer that document is pending
 */
export async function notifyFirstSigner(
  phone: string,
  documentName: string,
  tenantSlug: string,
  documentId: string
): Promise<void> {
  const link = `https://selo.triagest.com/${tenantSlug}/documentos/${documentId}`;
  const body = `📄 Documento "${documentName}" pendente de sua assinatura.\n\nClique: ${link}`;
  await sendWhatsAppNotification({ to: phone, body });
}

/**
 * Notify next signer in sequence
 */
export async function notifyNextSigner(
  phone: string,
  documentName: string,
  tenantSlug: string,
  documentId: string,
  signerName: string
): Promise<void> {
  const link = `https://selo.triagest.com/${tenantSlug}/documentos/${documentId}`;
  const body = `✋ É sua vez! "${documentName}" aguarda sua assinatura.\n\nClique: ${link}`;
  await sendWhatsAppNotification({ to: phone, body });
}

/**
 * Notify document creator that all signatures are complete
 */
export async function notifyAllSignaturesComplete(
  phone: string,
  documentName: string,
  tenantSlug: string,
  documentId: string
): Promise<void> {
  const link = `https://selo.triagest.com/${tenantSlug}/documentos/${documentId}`;
  const body = `✅ Todas as assinaturas de "${documentName}" foram finalizadas!\n\nVisualize: ${link}`;
  await sendWhatsAppNotification({ to: phone, body });
}
