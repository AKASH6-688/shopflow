import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ShopifyIntegration } from "@/lib/integrations/shopify";
import { WooCommerceIntegration } from "@/lib/integrations/woocommerce";
import { WixIntegration } from "@/lib/integrations/wix";
import { CustomStoreIntegration } from "@/lib/integrations/custom";

async function getStore(userId: string) {
  return prisma.store.findFirst({ where: { ownerId: userId } });
}

// POST /api/integrations/sync - Sync data from platform
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getStore((session.user as any).id);
  if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 });
  if (!store.apiKey) return NextResponse.json({ error: "No integration configured" }, { status: 400 });

  const { syncType } = await req.json(); // "products" | "orders" | "all"

  let integration: any;
  switch (store.platform) {
    case "SHOPIFY":
      integration = new ShopifyIntegration({
        shopDomain: store.url || "",
        accessToken: store.apiKey,
      });
      break;
    case "WOOCOMMERCE":
      integration = new WooCommerceIntegration({
        siteUrl: store.url || "",
        consumerKey: store.apiKey,
        consumerSecret: store.apiSecret || "",
      });
      break;
    case "WIX":
      integration = new WixIntegration({
        apiKey: store.apiKey,
        siteId: store.apiSecret || "",
      });
      break;
    case "CUSTOM":
    case "OTHER":
      integration = new CustomStoreIntegration({
        apiBaseUrl: store.url || "",
        apiKey: store.apiKey,
      });
      break;
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  const results: any = {};

  if (syncType === "products" || syncType === "all") {
    const products = await integration.getProducts();
    let synced = 0;
    for (const p of products) {
      await prisma.product.upsert({
        where: { storeId_sku: { storeId: store.id, sku: p.sku || `ext-${p.externalId}` } },
        update: {
          name: p.name,
          price: p.price,
          comparePrice: p.comparePrice,
          imageUrl: p.imageUrl,
          category: p.category,
          description: p.description,
        },
        create: {
          storeId: store.id,
          externalId: p.externalId,
          name: p.name,
          sku: p.sku || `ext-${p.externalId}`,
          price: p.price,
          comparePrice: p.comparePrice,
          imageUrl: p.imageUrl,
          category: p.category,
          description: p.description,
          tags: p.tags,
          inventoryItems: {
            create: { storeId: store.id, quantity: p.inventory || 0 },
          },
        },
      });
      synced++;
    }
    results.products = { total: products.length, synced };
  }

  if (syncType === "orders" || syncType === "all") {
    const orders = await integration.getOrders();
    let synced = 0;
    for (const o of orders) {
      if (!o.customer.phone) continue;

      let customer = await prisma.customer.findFirst({
        where: { storeId: store.id, phone: o.customer.phone },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            storeId: store.id,
            name: o.customer.name,
            phone: o.customer.phone,
            email: o.customer.email,
            address: o.customer.address,
            city: o.customer.city,
            country: o.customer.country,
          },
        });
      }

      const existing = await prisma.order.findFirst({
        where: { storeId: store.id, externalId: o.externalId },
      });

      if (!existing) {
        await prisma.order.create({
          data: {
            storeId: store.id,
            customerId: customer.id,
            externalId: o.externalId,
            orderNumber: o.orderNumber,
            status: o.status,
            subtotal: o.subtotal,
            shippingCost: o.shippingCost,
            tax: o.tax,
            discount: o.discount,
            total: o.total,
            paymentStatus: o.paymentStatus,
            createdAt: new Date(o.createdAt),
            statusHistory: { create: { status: o.status } },
          },
        });
        synced++;
      }
    }
    results.orders = { total: orders.length, synced };
  }

  return NextResponse.json(results);
}
