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

// GET /api/broadcasts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const broadcasts = await prisma.broadcast.findMany({
    where: { storeId },
    include: {
      abTest: { select: { id: true, name: true, winnerVariant: true } },
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(broadcasts);
}

// POST /api/broadcasts - Create or send
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { action, broadcastId, name, channel, subject, messageTemplate, segmentFilters, utmSource, utmMedium, utmCampaign, abTestId } = await req.json();

  // Send broadcast
  if (action === "send" && broadcastId) {
    const broadcast = await prisma.broadcast.findFirst({
      where: { id: broadcastId, storeId },
      include: { recipients: true },
    });
    if (!broadcast) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Build recipients from segment
    const filters = broadcast.segmentFilters as any || {};
    const where: any = { storeId };
    if (filters.isBlacklisted !== undefined) where.isBlacklisted = filters.isBlacklisted;
    if (filters.minOrders) where.totalOrders = { gte: filters.minOrders };
    if (filters.maxOrders) where.totalOrders = { ...where.totalOrders, lte: filters.maxOrders };
    if (filters.minSpent) where.totalSpent = { gte: filters.minSpent };
    if (filters.city) where.city = filters.city;
    if (filters.country) where.country = filters.country;

    const customers = await prisma.customer.findMany({ where, take: 1000 });

    // Create recipient records
    const recipientData = customers.map((c) => ({
      broadcastId: broadcast.id,
      customerId: c.id,
      recipient: broadcast.channel === "EMAIL" ? (c.email || "") : c.phone,
    })).filter((r) => r.recipient);

    await prisma.broadcastRecipient.createMany({ data: recipientData });

    // Send messages
    let sent = 0;
    for (const rec of recipientData) {
      const customer = customers.find((c) => c.id === rec.customerId);
      const body = broadcast.messageTemplate
        .replace(/\{\{name\}\}/g, customer?.name || "there")
        .replace(/\{\{phone\}\}/g, customer?.phone || "");

      try {
        if (broadcast.channel === "WHATSAPP") {
          await sendWhatsAppMessage(rec.recipient, body);
        } else if (broadcast.channel === "EMAIL") {
          await sendEmail(rec.recipient, broadcast.subject || "Update from our store", `<div style="font-family:sans-serif">${body}</div>`);
        }
        await prisma.broadcastRecipient.updateMany({
          where: { broadcastId: broadcast.id, recipient: rec.recipient },
          data: { status: "sent", sentAt: new Date() },
        });
        sent++;
      } catch {
        await prisma.broadcastRecipient.updateMany({
          where: { broadcastId: broadcast.id, recipient: rec.recipient },
          data: { status: "failed" },
        });
      }
    }

    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { status: "SENT", sentAt: new Date(), totalRecipients: recipientData.length, totalSent: sent },
    });

    return NextResponse.json({ sent, total: recipientData.length });
  }

  // Create broadcast
  if (!name || !messageTemplate) {
    return NextResponse.json({ error: "Name and message template are required" }, { status: 400 });
  }

  const broadcast = await prisma.broadcast.create({
    data: {
      storeId,
      name,
      channel: channel || "WHATSAPP",
      subject,
      messageTemplate,
      segmentFilters: segmentFilters || {},
      utmSource,
      utmMedium,
      utmCampaign,
      abTestId: abTestId || null,
    },
  });

  return NextResponse.json(broadcast);
}

// DELETE
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.broadcast.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
