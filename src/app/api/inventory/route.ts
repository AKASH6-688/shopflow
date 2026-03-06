import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/inventory - List inventory items
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const lowStock = req.nextUrl.searchParams.get("lowStock") === "true";

  const items = await prisma.inventoryItem.findMany({
    where: {
      storeId,
      ...(lowStock ? { quantity: { lte: prisma.raw("\"lowStockAlert\"") as any } } : {}),
      product: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    },
    include: {
      product: { select: { id: true, name: true, sku: true, price: true, imageUrl: true, category: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(items);
}

// POST /api/inventory - Update stock / add movement
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { productId, type, quantity, reason, warehouse } = await req.json();

  if (!productId || !type || typeof quantity !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find or create inventory item
  let inventoryItem = await prisma.inventoryItem.findFirst({
    where: { productId, warehouse: warehouse || "default", storeId },
  });

  if (!inventoryItem) {
    inventoryItem = await prisma.inventoryItem.create({
      data: { productId, storeId, warehouse: warehouse || "default", quantity: 0 },
    });
  }

  // Calculate new quantity
  let newQuantity = inventoryItem.quantity;
  if (type === "RESTOCK" || type === "RETURN") {
    newQuantity += quantity;
  } else if (type === "SALE" || type === "DAMAGED") {
    newQuantity = Math.max(0, newQuantity - quantity);
  } else if (type === "ADJUSTMENT") {
    newQuantity = quantity; // absolute set
  }

  // Update inventory and create movement record
  const [updated] = await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        quantity: newQuantity,
        lastRestocked: type === "RESTOCK" ? new Date() : undefined,
      },
    }),
    prisma.inventoryMovement.create({
      data: {
        inventoryItemId: inventoryItem.id,
        type,
        quantity,
        reason: reason || null,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
