import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAnalyticsData, getStoreSummary, getProfitLoss, getWinningProducts, type PeriodType } from "@/lib/analytics";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/analytics?type=summary|chart|profitloss|winning&period=15d|30d|1y|2y|5y
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const type = req.nextUrl.searchParams.get("type") || "summary";
  const period = (req.nextUrl.searchParams.get("period") || "30d") as PeriodType;

  switch (type) {
    case "summary": {
      const summary = await getStoreSummary(storeId);
      return NextResponse.json(summary);
    }
    case "chart": {
      const data = await getAnalyticsData(storeId, period);
      return NextResponse.json(data);
    }
    case "profitloss": {
      const pl = await getProfitLoss(storeId, period);
      return NextResponse.json(pl);
    }
    case "winning": {
      const limit = Number(req.nextUrl.searchParams.get("limit")) || 10;
      const products = await getWinningProducts(storeId, limit);
      return NextResponse.json(products);
    }
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}
