import { NextRequest, NextResponse } from "next/server";

// GET /api/calling/gather - Twilio call gather callback
export async function POST(req: NextRequest) {
  const formData = await req.text();
  const params = new URLSearchParams(formData);
  const digits = params.get("Digits");
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");

  let twiml: string;

  if (digits === "1") {
    twiml = `<Response><Say voice="alice">Thank you! Your order ${orderNumber} has been confirmed. We will process it shortly. Goodbye!</Say></Response>`;
  } else if (digits === "2") {
    twiml = `<Response><Say voice="alice">Your order ${orderNumber} has been cancelled. If this was a mistake, please contact us. Goodbye!</Say></Response>`;
  } else {
    twiml = `<Response><Say voice="alice">Invalid input. Your order ${orderNumber} will remain pending. Please contact us for help. Goodbye!</Say></Response>`;
  }

  return new NextResponse(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}
