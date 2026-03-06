import twilio from "twilio";

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

const PHONE_FROM = process.env.TWILIO_PHONE_NUMBER || "+1234567890";

export async function makeConfirmationCall(
  to: string,
  orderNumber: string,
  customerName: string,
  callbackUrl: string
) {
  const twiml = `
    <Response>
      <Say voice="alice">
        Hello ${customerName}. This is a call from ShopFlow to confirm your order number ${orderNumber}.
        Press 1 to confirm your order.
        Press 2 to cancel your order.
      </Say>
      <Gather numDigits="1" action="${callbackUrl}/api/calling/gather?orderNumber=${orderNumber}" method="POST">
        <Say voice="alice">Please press 1 to confirm or 2 to cancel.</Say>
      </Gather>
      <Say voice="alice">We didn't receive any input. Your order will remain pending. Goodbye.</Say>
    </Response>
  `;

  const call = await getClient().calls.create({
    from: PHONE_FROM,
    to,
    twiml,
  });

  return { callSid: call.sid, status: call.status };
}

export async function makeFollowUpCall(
  to: string,
  customerName: string,
  message: string
) {
  const twiml = `
    <Response>
      <Say voice="alice">${message}</Say>
    </Response>
  `;

  const call = await getClient().calls.create({
    from: PHONE_FROM,
    to,
    twiml,
  });

  return { callSid: call.sid, status: call.status };
}
