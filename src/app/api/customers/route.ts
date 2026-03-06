import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/customers
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const blacklisted = req.nextUrl.searchParams.get("blacklisted");

  const customers = await prisma.customer.findMany({
    where: {
      storeId,
      ...(blacklisted === "true" ? { isBlacklisted: true } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

// PUT /api/customers - Update customer (e.g., toggle blacklist)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { customerId, isBlacklisted, blacklistReason, notes } = await req.json();

  if (!customerId) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(typeof isBlacklisted === "boolean"
        ? {
            isBlacklisted,
            blacklistReason: isBlacklisted ? blacklistReason || "Manual blacklist" : null,
            blacklistedAt: isBlacklisted ? new Date() : null,
          }
        : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return NextResponse.json(customer);
}
