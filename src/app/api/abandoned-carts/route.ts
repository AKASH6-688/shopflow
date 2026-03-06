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

// GET /api/abandoned-carts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const status = req.nextUrl.searchParams.get("status");

  const carts = await prisma.abandonedCart.findMany({
    where: {
      storeId,
      ...(status ? { status: status as any } : {}),
    },
    include: { customer: { select: { name: true, phone: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Stats
  const [totalAbandoned, totalRecovered, totalValue, recoveredValue] = await Promise.all([
    prisma.abandonedCart.count({ where: { storeId } }),
    prisma.abandonedCart.count({ where: { storeId, status: "RECOVERED" } }),
    prisma.abandonedCart.aggregate({ where: { storeId }, _sum: { cartTotal: true } }),
    prisma.abandonedCart.aggregate({ where: { storeId, status: "RECOVERED" }, _sum: { cartTotal: true } }),
  ]);

  return NextResponse.json({
    carts,
    stats: {
      totalAbandoned,
      totalRecovered,
      recoveryRate: totalAbandoned > 0 ? Math.round((totalRecovered / totalAbandoned) * 100) : 0,
      totalValue: totalValue._sum.cartTotal || 0,
      recoveredValue: recoveredValue._sum.cartTotal || 0,
    },
  });
}

// POST /api/abandoned-carts - Create cart or send reminder
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { action, cartId, customerPhone, customerEmail, customerName, cartItems, cartTotal, checkoutUrl, discountCode, discountPercent } = await req.json();

  // Send recovery reminder
  if (action === "send_reminder" && cartId) {
    const cart = await prisma.abandonedCart.findFirst({
      where: { id: cartId, storeId },
      include: { customer: true },
    });
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    const itemList = (cart.cartItems as any[]).map((i: any) => `• ${i.name} x${i.quantity} — $${i.price}`).join("\n");
    const discount = cart.discountCode ? `\n\n🎁 Use code ${cart.discountCode} for ${cart.discountPercent}% off!` : "";
    const link = cart.checkoutUrl ? `\n\n🛒 Complete your order: ${cart.checkoutUrl}` : "";

    const tierMessages = [
      `Hi ${cart.customerName || "there"}! 👋\n\nYou left some items in your cart:\n${itemList}\n\nTotal: $${cart.cartTotal.toFixed(2)}\n\nReady to complete your purchase?${link}`,
      `Hey ${cart.customerName || "there"}! 🛍️\n\nYour cart is waiting! Don't miss out on:\n${itemList}${discount}${link}\n\nItems are selling fast!`,
      `Last chance ${cart.customerName || ""}! ⏰\n\nYour cart expires soon:\n${itemList}\n\nTotal: $${cart.cartTotal.toFixed(2)}${discount}${link}\n\nDon't miss this!`,
    ];

    const messageIndex = Math.min(cart.remindersSent, tierMessages.length - 1);
    const body = tierMessages[messageIndex];

    // Send via WhatsApp or email
    if (cart.customerPhone) {
      try { await sendWhatsAppMessage(cart.customerPhone, body); } catch {}
    }
    if (cart.customerEmail) {
      try { await sendEmail(cart.customerEmail, "You left items in your cart!", `<pre style="font-family:sans-serif;white-space:pre-wrap">${body}</pre>`); } catch {}
    }

    const updated = await prisma.abandonedCart.update({
      where: { id: cartId },
      data: {
        remindersSent: { increment: 1 },
        lastReminderAt: new Date(),
        status: "REMINDER_SENT",
      },
    });

    return NextResponse.json(updated);
  }

  // Mark as recovered
  if (action === "mark_recovered" && cartId) {
    const updated = await prisma.abandonedCart.update({
      where: { id: cartId },
      data: { status: "RECOVERED", recoveredAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  // Create abandoned cart
  if (!cartItems?.length || !cartTotal) {
    return NextResponse.json({ error: "Cart items and total are required" }, { status: 400 });
  }

  let customerId: string | undefined;
  if (customerPhone) {
    const customer = await prisma.customer.findFirst({ where: { storeId, phone: customerPhone } });
    customerId = customer?.id;
  }

  const cart = await prisma.abandonedCart.create({
    data: {
      storeId,
      customerId,
      customerPhone,
      customerEmail,
      customerName,
      cartItems,
      cartTotal,
      checkoutUrl,
      discountCode,
      discountPercent,
    },
  });

  return NextResponse.json(cart);
}
