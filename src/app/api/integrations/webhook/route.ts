import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/integrations/webhook - Universal webhook handler
export async function POST(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  const token = req.nextUrl.searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const store = await prisma.store.findUnique({ where: { pluginToken: token } });
  if (!store) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await req.json();

  try {
    switch (platform) {
      case "shopify":
        await handleShopifyWebhook(store.id, body, req.headers);
        break;
      case "woocommerce":
        await handleWooCommerceWebhook(store.id, body, req.headers);
        break;
      case "wix":
        await handleWixWebhook(store.id, body, req.headers);
        break;
      default:
        await handleGenericWebhook(store.id, body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleShopifyWebhook(storeId: string, data: any, headers: Headers) {
  const topic = headers.get("x-shopify-topic");

  if (topic === "orders/create" || topic === "orders/updated") {
    await syncOrderFromWebhook(storeId, {
      externalId: String(data.id),
      orderNumber: data.name || String(data.order_number),
      total: parseFloat(data.total_price || "0"),
      customerName: `${data.customer?.first_name || ""} ${data.customer?.last_name || ""}`.trim(),
      customerPhone: data.customer?.phone || data.shipping_address?.phone || "",
      customerEmail: data.customer?.email || null,
    });
  }

  if (topic === "products/update") {
    await syncProductInventory(storeId, String(data.id), data.variants?.[0]?.inventory_quantity);
  }
}

async function handleWooCommerceWebhook(storeId: string, data: any, headers: Headers) {
  const topic = headers.get("x-wc-webhook-topic");

  if (topic === "order.created" || topic === "order.updated") {
    await syncOrderFromWebhook(storeId, {
      externalId: String(data.id),
      orderNumber: String(data.number),
      total: parseFloat(data.total || "0"),
      customerName: `${data.billing?.first_name || ""} ${data.billing?.last_name || ""}`.trim(),
      customerPhone: data.billing?.phone || "",
      customerEmail: data.billing?.email || null,
    });
  }
}

async function handleWixWebhook(storeId: string, data: any, _headers: Headers) {
  if (data.data?.order) {
    const order = data.data.order;
    await syncOrderFromWebhook(storeId, {
      externalId: order.id,
      orderNumber: String(order.number),
      total: order.totals?.total || 0,
      customerName: `${order.billingInfo?.firstName || ""} ${order.billingInfo?.lastName || ""}`.trim(),
      customerPhone: order.buyerInfo?.phone || "",
      customerEmail: order.buyerInfo?.email || null,
    });
  }
}

async function handleGenericWebhook(storeId: string, data: any) {
  // Generic handler for custom store webhooks
  if (data.order) {
    await syncOrderFromWebhook(storeId, {
      externalId: String(data.order.id || data.order._id),
      orderNumber: String(data.order.number || data.order.order_number || data.order.id),
      total: parseFloat(data.order.total || "0"),
      customerName: data.order.customer_name || data.order.customer?.name || "Customer",
      customerPhone: data.order.customer_phone || data.order.customer?.phone || "",
      customerEmail: data.order.customer_email || data.order.customer?.email || null,
    });
  }
}

async function syncOrderFromWebhook(
  storeId: string,
  data: {
    externalId: string;
    orderNumber: string;
    total: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
  }
) {
  if (!data.customerPhone) return;

  // Find or create customer
  let customer = await prisma.customer.findFirst({
    where: { storeId, phone: data.customerPhone },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        storeId,
        name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail,
      },
    });
  }

  // Upsert order
  const existing = await prisma.order.findFirst({
    where: { storeId, externalId: data.externalId },
  });

  if (!existing) {
    await prisma.order.create({
      data: {
        storeId,
        customerId: customer.id,
        externalId: data.externalId,
        orderNumber: data.orderNumber,
        subtotal: data.total,
        total: data.total,
        statusHistory: { create: { status: "PENDING" } },
      },
    });
  }
}

async function syncProductInventory(storeId: string, externalId: string, quantity?: number) {
  if (typeof quantity !== "number") return;
  const product = await prisma.product.findFirst({ where: { storeId, externalId } });
  if (!product) return;

  await prisma.inventoryItem.updateMany({
    where: { productId: product.id, storeId },
    data: { quantity },
  });
}
