import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAIResponse } from "@/lib/ai-chat";

export async function POST(request: NextRequest) {
  try {
    const { token, email, message, conversationId } = await request.json();

    if (!token || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find store by plugin token
    const store = await prisma.store.findUnique({ where: { pluginToken: token } });
    if (!store) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { email, storeId: store.id },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { email, name: email.split("@")[0], storeId: store.id },
      });
    }

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, storeId: store.id },
      });
    }
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { customerId: customer.id, storeId: store.id, status: "ACTIVE" },
      });
    }

    // Save customer message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "CUSTOMER",
        content: message,
      },
    });

    // Generate AI reply
    const aiReply = await getAIResponse(store.id, customer.id, message);

    // Save AI message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "AI",
        content: aiReply,
      },
    });

    return NextResponse.json({
      reply: aiReply,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Plugin chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
