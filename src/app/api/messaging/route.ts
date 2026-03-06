import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/messaging - Get message logs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const channel = req.nextUrl.searchParams.get("channel");

  const logs = await prisma.messageLog.findMany({
    where: {
      storeId,
      ...(channel ? { channel: channel as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(logs);
}

// POST /api/messaging - Send custom message
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { channel, recipient, subject, body } = await req.json();

  if (!channel || !recipient || !body) {
    return NextResponse.json({ error: "Channel, recipient, and body are required" }, { status: 400 });
  }

  let result: any = {};

  if (channel === "WHATSAPP") {
    result = await sendWhatsAppMessage(recipient, body);
  } else if (channel === "EMAIL") {
    if (!subject) {
      return NextResponse.json({ error: "Subject is required for email" }, { status: 400 });
    }
    result = await sendEmail(recipient, subject, `<p>${body}</p>`);
  }

  const log = await prisma.messageLog.create({
    data: {
      storeId,
      channel,
      recipient,
      subject: subject || null,
      body,
      status: "sent",
      externalId: result.sid || result.messageId || null,
    },
  });

  return NextResponse.json(log);
}
