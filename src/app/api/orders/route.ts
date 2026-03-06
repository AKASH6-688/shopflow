import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendOrderConfirmation, sendTrackingNumber, sendThankYouNote, sendBlacklistWarning } from "@/lib/whatsapp";
import { sendOrderConfirmationEmail, sendTrackingEmail, sendThankYouEmail } from "@/lib/email";
import { makeConfirmationCall } from "@/lib/calling";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/orders
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search") || "";

  const orders = await prisma.order.findMany({
    where: {
      storeId,
      ...(status ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
              { customer: { phone: { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true, isBlacklisted: true, nonReceivedCount: true } },
      items: { include: { product: { select: { name: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(orders);
}

// POST /api/orders - Create order
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const body = await req.json();
  const { customerPhone, customerName, customerEmail, items, shippingCost, tax, discount, notes } = body;

  if (!customerPhone || !customerName || !items?.length) {
    return NextResponse.json({ error: "Customer info and items are required" }, { status: 400 });
  }

  // Find or create customer
  let customer = await prisma.customer.findFirst({
    where: { storeId, phone: customerPhone },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        storeId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail || null,
      },
    });
  }

  // Check blacklist
  let blacklistWarning = null;
  if (customer.isBlacklisted) {
    blacklistWarning = {
      message: `⚠️ WARNING: This customer is BLACKLISTED with ${customer.nonReceivedCount} non-received orders!`,
      nonReceivedCount: customer.nonReceivedCount,
    };
  }

  // Calculate totals
  const productIds = items.map((i: any) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  let subtotal = 0;
  let totalCost = 0;
  const orderItems = items.map((item: any) => {
    const product = products.find((p) => p.id === item.productId);
    const price = product?.price || 0;
    const cost = product?.costPrice || 0;
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;
    totalCost += cost * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price,
      costPrice: cost,
      total: itemTotal,
    };
  });

  const total = subtotal + (shippingCost || 0) + (tax || 0) - (discount || 0);
  const profit = total - totalCost - (shippingCost || 0);

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      storeId,
      customerId: customer.id,
      orderNumber,
      subtotal,
      shippingCost: shippingCost || 0,
      tax: tax || 0,
      discount: discount || 0,
      total,
      profit,
      notes: notes || null,
      items: { create: orderItems },
      statusHistory: { create: { status: "PENDING" } },
    },
    include: { customer: true, items: { include: { product: true } } },
  });

  // Update customer stats
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      totalOrders: { increment: 1 },
      totalSpent: { increment: total },
    },
  });

  // Update product stats
  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        totalSold: { increment: item.quantity },
        totalRevenue: { increment: item.total },
        totalProfit: { increment: item.total - item.costPrice * item.quantity },
      },
    });
  }

  // Auto-send WhatsApp confirmation
  try {
    await sendOrderConfirmation(customer.phone, orderNumber, customer.name);
    await prisma.messageLog.create({
      data: {
        storeId,
        channel: "WHATSAPP",
        recipient: customer.phone,
        body: `Order confirmation for #${orderNumber}`,
        status: "sent",
      },
    });
  } catch (e) {
    // Log but don't fail
  }

  // Auto-send email if provided
  if (customer.email) {
    try {
      await sendOrderConfirmationEmail(
        customer.email,
        customer.name,
        orderNumber,
        order.items.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.price })),
        total
      );
      await prisma.messageLog.create({
        data: {
          storeId,
          channel: "EMAIL",
          recipient: customer.email,
          subject: `Order #${orderNumber} Confirmed`,
          body: `Order confirmation email sent`,
          status: "sent",
        },
      });
    } catch (e) {
      // Log but don't fail
    }
  }

  // Auto-call to confirm order
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await makeConfirmationCall(customer.phone, orderNumber, customer.name, appUrl);
    await prisma.messageLog.create({
      data: {
        storeId,
        channel: "PHONE_CALL",
        recipient: customer.phone,
        body: `Confirmation call for order #${orderNumber}`,
        status: "initiated",
      },
    });
  } catch (e) {
    // Log but don't fail
  }

  return NextResponse.json({ order, blacklistWarning });
}

// PUT /api/orders - Update order status
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { orderId, status, trackingNumber, shippingCarrier, trackingUrl } = await req.json();

  if (!orderId || !status) {
    return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { customer: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const updateData: any = {
    status,
    statusHistory: { create: { status } },
  };

  if (status === "CONFIRMED") updateData.confirmedAt = new Date();
  if (status === "SHIPPED") {
    updateData.shippedAt = new Date();
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingCarrier) updateData.shippingCarrier = shippingCarrier;
    if (trackingUrl) updateData.trackingUrl = trackingUrl;
  }
  if (status === "DELIVERED") updateData.deliveredAt = new Date();
  if (status === "CANCELLED") updateData.cancelledAt = new Date();
  if (status === "RETURNED") updateData.returnedAt = new Date();

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: { customer: true },
  });

  // Handle NOT_RECEIVED - blacklist logic
  if (status === "NOT_RECEIVED") {
    const newCount = order.customer.nonReceivedCount + 1;
    const shouldBlacklist = newCount >= 2; // Blacklist after 2 non-received orders

    await prisma.customer.update({
      where: { id: order.customerId },
      data: {
        nonReceivedCount: { increment: 1 },
        isBlacklisted: shouldBlacklist || order.customer.isBlacklisted,
        blacklistReason: shouldBlacklist ? `${newCount} non-received orders` : undefined,
        blacklistedAt: shouldBlacklist && !order.customer.isBlacklisted ? new Date() : undefined,
      },
    });

    // Send warning via WhatsApp
    try {
      await sendBlacklistWarning(order.customer.phone, order.customer.name, newCount);
    } catch (e) {}
  }

  // Send tracking info when shipped
  if (status === "SHIPPED" && trackingNumber) {
    try {
      await sendTrackingNumber(
        order.customer.phone,
        order.orderNumber,
        trackingNumber,
        shippingCarrier || "Carrier",
        order.customer.name
      );
    } catch (e) {}

    if (order.customer.email) {
      try {
        await sendTrackingEmail(
          order.customer.email,
          order.customer.name,
          order.orderNumber,
          trackingNumber,
          shippingCarrier || "Carrier",
          trackingUrl
        );
      } catch (e) {}
    }
  }

  // Send thank you when delivered
  if (status === "DELIVERED") {
    try {
      await sendThankYouNote(order.customer.phone, order.customer.name, order.orderNumber);
    } catch (e) {}

    if (order.customer.email) {
      try {
        await sendThankYouEmail(order.customer.email, order.customer.name, order.orderNumber);
      } catch (e) {}
    }
  }

  return NextResponse.json(updated);
}
