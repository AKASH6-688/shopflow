import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

export async function sendWhatsAppMessage(to: string, body: string) {
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const message = await client.messages.create({
    from: WHATSAPP_FROM,
    to: formattedTo,
    body,
  });

  return { sid: message.sid, status: message.status };
}

export async function sendOrderConfirmation(phone: string, orderNumber: string, customerName: string) {
  const body = `Hi ${customerName}! 🎉\n\nYour order #${orderNumber} has been confirmed! We're preparing it for shipment.\n\nThank you for shopping with us!\n\n- ShopFlow`;
  return sendWhatsAppMessage(phone, body);
}

export async function sendTrackingNumber(
  phone: string,
  orderNumber: string,
  trackingNumber: string,
  carrier: string,
  customerName: string
) {
  const body = `Hi ${customerName}! 📦\n\nGreat news! Your order #${orderNumber} has been shipped!\n\n🚚 Carrier: ${carrier}\n📋 Tracking: ${trackingNumber}\n\nYou can track your package using the tracking number above.\n\nThank you! - ShopFlow`;
  return sendWhatsAppMessage(phone, body);
}

export async function sendThankYouNote(phone: string, customerName: string, orderNumber: string) {
  const body = `Hi ${customerName}! 💝\n\nThank you for receiving your order #${orderNumber}! We hope you love your purchase.\n\nIf you have any questions or need help, just reply here!\n\n⭐ We'd love to hear your feedback.\n\n- ShopFlow`;
  return sendWhatsAppMessage(phone, body);
}

export async function sendBlacklistWarning(phone: string, customerName: string, nonReceivedCount: number) {
  const body = `Hi ${customerName},\n\nWe noticed you have ${nonReceivedCount} order(s) that were not received. Please ensure your delivery details are correct for future orders.\n\nIf there was a mistake, please contact us!\n\n- ShopFlow`;
  return sendWhatsAppMessage(phone, body);
}
