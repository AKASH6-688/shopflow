import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAIResponse } from "@/lib/ai-chat";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/chat - List conversations
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const conversationId = req.nextUrl.searchParams.get("conversationId");

  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, storeId },
      include: {
        customer: { select: { name: true, phone: true, email: true, isBlacklisted: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    return NextResponse.json(conversation);
  }

  const conversations = await prisma.conversation.findMany({
    where: { storeId },
    include: {
      customer: { select: { name: true, phone: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}

// POST /api/chat - Send message (customer or seller)
export async function POST(req: NextRequest) {
  const { message, conversationId, storeToken, customerPhone, customerName, sellerOverride } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  let storeId: string;

  // If storeToken is provided, it's from the plugin (customer)
  if (storeToken) {
    const store = await prisma.store.findUnique({ where: { pluginToken: storeToken } });
    if (!store) return NextResponse.json({ error: "Invalid store token" }, { status: 401 });
    storeId = store.id;
  } else {
    // Seller is sending a manual message
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const store = await prisma.store.findFirst({ where: { ownerId: (session.user as any).id } });
    if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 });
    storeId = store.id;
  }

  // Find or create conversation
  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, storeId },
    });
  }

  if (!conversation && customerPhone) {
    // Find customer
    let customer = await prisma.customer.findFirst({
      where: { storeId, phone: customerPhone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { storeId, name: customerName || "Customer", phone: customerPhone },
      });
    }

    // Find active conversation or create new
    conversation = await prisma.conversation.findFirst({
      where: { storeId, customerId: customer.id, status: "ACTIVE" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { storeId, customerId: customer.id, subject: "Product Inquiry" },
      });
    }
  }

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Save customer message
  const sender = sellerOverride ? "SELLER" : (storeToken ? "CUSTOMER" : "SELLER");
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content: message,
      sender,
    },
  });

  // If it's a customer message and not a seller override, get AI response
  let aiResponse = null;
  if (sender === "CUSTOMER") {
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const conversationHistory = history.map((m) => ({
      role: (m.sender === "CUSTOMER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

    aiResponse = await getAIResponse(storeId, message, conversationHistory, customerPhone);

    // Save AI response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: aiResponse,
        sender: "AI",
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
  }

  return NextResponse.json({
    conversationId: conversation.id,
    aiResponse,
  });
}

// PATCH /api/chat - Update conversation triage (priority, assignedTo, SLA, tags)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { conversationId, priority, assignedTo, slaDeadline, tags } = await req.json();
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  const data: any = {};
  if (priority !== undefined) data.priority = priority;
  if (assignedTo !== undefined) data.assignedTo = assignedTo;
  if (slaDeadline !== undefined) data.slaDeadline = slaDeadline ? new Date(slaDeadline) : null;
  if (tags !== undefined) data.tags = tags;

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data,
  });

  return NextResponse.json(updated);
}
