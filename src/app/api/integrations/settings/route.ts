import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getStore(userId: string) {
  return prisma.store.findFirst({ where: { ownerId: userId } });
}

// GET /api/integrations/settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getStore((session.user as any).id);
  if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 });

  return NextResponse.json({
    id: store.id,
    name: store.name,
    url: store.url,
    platform: store.platform,
    currency: store.currency,
    timezone: store.timezone,
    pluginToken: store.pluginToken,
    hasApiKey: !!store.apiKey,
  });
}

// PUT /api/integrations/settings - Update store/integration settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getStore((session.user as any).id);
  if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { name, url, platform, apiKey, apiSecret, currency, timezone } = await req.json();

  const updated = await prisma.store.update({
    where: { id: store.id },
    data: {
      ...(name ? { name } : {}),
      ...(url ? { url } : {}),
      ...(platform ? { platform } : {}),
      ...(apiKey ? { apiKey } : {}),
      ...(apiSecret ? { apiSecret } : {}),
      ...(currency ? { currency } : {}),
      ...(timezone ? { timezone } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    platform: updated.platform,
    pluginToken: updated.pluginToken,
  });
}
