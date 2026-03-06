import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/products
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const search = req.nextUrl.searchParams.get("search") || "";

  const products = await prisma.product.findMany({
    where: {
      storeId,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      inventoryItems: { select: { quantity: true, warehouse: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

// POST /api/products - Create product
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const body = await req.json();
  const { name, sku, price, costPrice, comparePrice, category, description, imageUrl, tags, benefits, initialStock } = body;

  if (!name || typeof price !== "number") {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      storeId,
      name,
      sku: sku || null,
      price,
      costPrice: costPrice || 0,
      comparePrice: comparePrice || null,
      category: category || null,
      description: description || null,
      imageUrl: imageUrl || null,
      tags: tags || [],
      benefits: benefits || [],
      inventoryItems: initialStock
        ? {
            create: {
              storeId,
              quantity: initialStock,
              warehouse: "default",
            },
          }
        : undefined,
    },
  });

  return NextResponse.json(product);
}

// PUT /api/products - Update product
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(product);
}
