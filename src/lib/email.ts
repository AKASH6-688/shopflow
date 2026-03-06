import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || "ShopFlow <noreply@shopflow.com>";

export async function sendEmail(to: string, subject: string, html: string) {
  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
  });
  return { messageId: info.messageId };
}

export async function sendOrderConfirmationEmail(
  email: string,
  customerName: string,
  orderNumber: string,
  items: { name: string; quantity: number; price: number }[],
  total: number
) {
  const itemsHtml = items
    .map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.price.toFixed(2)}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4263eb;">Order Confirmed! 🎉</h2>
      <p>Hi ${customerName},</p>
      <p>Your order <strong>#${orderNumber}</strong> has been confirmed!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 8px; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: left;">Qty</th>
            <th style="padding: 8px; text-align: left;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="font-size: 18px;"><strong>Total: $${total.toFixed(2)}</strong></p>
      <p>We'll notify you once your order ships!</p>
      <hr />
      <p style="color: #868e96; font-size: 12px;">Powered by ShopFlow</p>
    </div>
  `;

  return sendEmail(email, `Order #${orderNumber} Confirmed - ShopFlow`, html);
}

export async function sendTrackingEmail(
  email: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  carrier: string,
  trackingUrl?: string
) {
  const trackLink = trackingUrl
    ? `<a href="${trackingUrl}" style="color: #4263eb;">Track your package</a>`
    : `Tracking Number: <strong>${trackingNumber}</strong>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4263eb;">Your Order Has Shipped! 📦</h2>
      <p>Hi ${customerName},</p>
      <p>Your order <strong>#${orderNumber}</strong> is on its way!</p>
      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p>🚚 <strong>Carrier:</strong> ${carrier}</p>
        <p>📋 ${trackLink}</p>
      </div>
      <p>Thank you for shopping with us!</p>
      <hr />
      <p style="color: #868e96; font-size: 12px;">Powered by ShopFlow</p>
    </div>
  `;

  return sendEmail(email, `Order #${orderNumber} Shipped - ShopFlow`, html);
}

export async function sendThankYouEmail(email: string, customerName: string, orderNumber: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4263eb;">Thank You! 💝</h2>
      <p>Hi ${customerName},</p>
      <p>Thank you for receiving your order <strong>#${orderNumber}</strong>!</p>
      <p>We hope you love your purchase. If you have any questions, don't hesitate to reach out!</p>
      <p>⭐ We'd love to hear your feedback!</p>
      <hr />
      <p style="color: #868e96; font-size: 12px;">Powered by ShopFlow</p>
    </div>
  `;

  return sendEmail(email, `Thank You for Your Order! - ShopFlow`, html);
}
