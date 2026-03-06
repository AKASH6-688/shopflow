import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/ab-tests
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const tests = await prisma.aBTest.findMany({
    where: { storeId },
    include: {
      broadcasts: { select: { id: true, name: true, totalSent: true, totalRecipients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tests);
}

// POST /api/ab-tests - Create, update, or declare winner
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { action, testId, name, variantA, variantB, splitPercent, winnerMetric, winnerVariant, statsA, statsB } = await req.json();

  // Declare winner
  if (action === "declare_winner" && testId) {
    const test = await prisma.aBTest.update({
      where: { id: testId },
      data: {
        winnerVariant: winnerVariant || "A",
        status: "COMPLETED",
      },
    });
    return NextResponse.json(test);
  }

  // Update stats
  if (action === "update_stats" && testId) {
    const test = await prisma.aBTest.update({
      where: { id: testId },
      data: { statsA: statsA || {}, statsB: statsB || {} },
    });
    return NextResponse.json(test);
  }

  // Create
  if (!name || !variantA || !variantB) {
    return NextResponse.json({ error: "Name and both variants required" }, { status: 400 });
  }

  const test = await prisma.aBTest.create({
    data: {
      storeId,
      name,
      variantA,
      variantB,
      splitPercent: splitPercent || 50,
      winnerMetric: winnerMetric || "open_rate",
      status: "RUNNING",
    },
  });

  return NextResponse.json(test);
}

// DELETE
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.aBTest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
