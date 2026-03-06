import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "crypto";

const prisma = new PrismaClient();

function hash(pw: string) {
  return createHash("sha256").update(pw).digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const user = await prisma.user.create({
    data: {
      email: "demo@shopflow.com",
      name: "Demo User",
      password: hash("demo1234"),
    },
  });

  // Create demo store
  const store = await prisma.store.create({
    data: {
      name: "Demo Store",
      url: "https://demo-store.example.com",
      platform: "CUSTOM",
      currency: "USD",
      pluginToken: randomBytes(24).toString("hex"),
      userId: user.id,
    },
  });

  // Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        storeId: store.id, title: "Wireless Earbuds Pro", sku: "WEP-001", price: 49.99, cost: 18.50,
        description: "Premium wireless earbuds with active noise cancellation.",
        benefits: ["Noise Cancellation", "30h Battery", "IPX5 Waterproof"],
        winScore: 87,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id, title: "Smart Watch X200", sku: "SWX-200", price: 129.99, cost: 52.0,
        description: "Fitness-focused smartwatch with heart rate monitoring.",
        benefits: ["Heart Rate Monitor", "GPS Tracking", "7-day Battery"],
        winScore: 72,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id, title: "USB-C Hub 7-in-1", sku: "HUB-7IN1", price: 34.99, cost: 11.0,
        description: "Portable USB-C hub with HDMI, USB 3.0, and SD card reader.",
        benefits: ["4K HDMI", "100W PD Passthrough", "Aluminum Build"],
        winScore: 65,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id, title: "LED Desk Lamp", sku: "LAMP-LED1", price: 27.99, cost: 9.0,
        description: "Adjustable LED desk lamp with touch controls.",
        benefits: ["5 Dimming Levels", "Touch Controls", "USB Charging Port"],
        winScore: 55,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id, title: "Phone Case Ultra", sku: "PC-ULTRA", price: 14.99, cost: 2.50,
        description: "Slim protective phone case with military-grade drop protection.",
        benefits: ["MIL-STD Drop Tested", "Slim Design", "Wireless Charge Compatible"],
        winScore: 91,
      },
    }),
  ]);

  // Inventory
  for (const product of products) {
    const qty = Math.floor(Math.random() * 300) + 20;
    await prisma.inventoryItem.create({
      data: {
        productId: product.id, storeId: store.id, quantity: qty,
        lowStockThreshold: 25, location: "Warehouse A",
      },
    });
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id, storeId: store.id, type: "RESTOCK",
        quantity: qty, note: "Initial stock",
      },
    });
  }

  // Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { storeId: store.id, name: "Ali Khan", email: "ali@example.com", phone: "+923001234567" } }),
    prisma.customer.create({ data: { storeId: store.id, name: "Sara Ahmed", email: "sara@example.com", phone: "+923009876543" } }),
    prisma.customer.create({ data: { storeId: store.id, name: "John Smith", email: "john@example.com", phone: "+12025551234" } }),
    prisma.customer.create({ data: { storeId: store.id, name: "Emily Chen", email: "emily@example.com", phone: "+14155559876", nonReceivedCount: 3, isBlacklisted: true } }),
  ]);

  // Orders
  const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "NOT_RECEIVED"] as const;
  for (let i = 0; i < 20; i++) {
    const cust = customers[i % customers.length];
    const prod = products[i % products.length];
    const status = statuses[i % statuses.length];
    const qty = Math.floor(Math.random() * 3) + 1;
    await prisma.order.create({
      data: {
        storeId: store.id,
        customerId: cust.id,
        orderNumber: `ORD-${String(1000 + i).padStart(5, "0")}`,
        status,
        paymentStatus: "PAID",
        subtotal: prod.price * qty,
        shipping: 5.99,
        tax: prod.price * qty * 0.08,
        total: prod.price * qty + 5.99 + prod.price * qty * 0.08,
        confirmedByCall: i % 3 === 0,
        items: { create: { productId: prod.id, quantity: qty, price: prod.price, cost: prod.cost } },
      },
    });
  }

  // Analytics snapshots (last 60 days)
  for (let d = 60; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);
    const revenue = Math.round((Math.random() * 800 + 200) * 100) / 100;
    const cost = Math.round(revenue * (0.3 + Math.random() * 0.15) * 100) / 100;
    const orders = Math.floor(Math.random() * 12) + 1;
    await prisma.analyticsSnapshot.create({
      data: {
        storeId: store.id, date,
        revenue, cost, profit: revenue - cost,
        orders, visitors: orders * Math.floor(Math.random() * 20 + 10),
        conversionRate: Math.round(Math.random() * 5 * 100) / 100,
      },
    });
  }

  // Expenses
  await prisma.expense.createMany({
    data: [
      { storeId: store.id, category: "Shipping", amount: 245.50, description: "Monthly shipping fees", date: new Date() },
      { storeId: store.id, category: "Marketing", amount: 500.0, description: "Facebook Ads", date: new Date() },
      { storeId: store.id, category: "Software", amount: 29.99, description: "Email service subscription", date: new Date() },
    ],
  });

  console.log("Seed complete!");
  console.log(`  User: demo@shopflow.com / demo1234`);
  console.log(`  Store: ${store.name} (${store.pluginToken})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
