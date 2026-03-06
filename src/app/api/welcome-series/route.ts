import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/welcome-series
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const series = await prisma.welcomeSeries.findMany({
    where: { storeId },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const enrollmentStats = await prisma.welcomeEnrollment.groupBy({
    by: ["status"],
    where: { storeId },
    _count: true,
  });

  return NextResponse.json({ series, enrollmentStats });
}

// POST /api/welcome-series - Create or update
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { id, name, triggerEvent, incentiveType, incentiveValue, isActive, steps } = await req.json();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  if (id) {
    // Update existing
    await prisma.welcomeStep.deleteMany({ where: { seriesId: id } });
    const updated = await prisma.welcomeSeries.update({
      where: { id },
      data: {
        name,
        triggerEvent,
        incentiveType,
        incentiveValue,
        isActive: isActive ?? true,
        steps: steps?.length ? {
          create: steps.map((s: any, i: number) => ({
            stepOrder: i + 1,
            delayMinutes: s.delayMinutes || 0,
            channel: s.channel || "WHATSAPP",
            subject: s.subject || null,
            messageTemplate: s.messageTemplate,
            isActive: s.isActive ?? true,
          })),
        } : undefined,
      },
      include: { steps: true },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.welcomeSeries.create({
    data: {
      storeId,
      name,
      triggerEvent: triggerEvent || "signup",
      incentiveType,
      incentiveValue,
      steps: steps?.length ? {
        create: steps.map((s: any, i: number) => ({
          stepOrder: i + 1,
          delayMinutes: s.delayMinutes || 0,
          channel: s.channel || "WHATSAPP",
          subject: s.subject || null,
          messageTemplate: s.messageTemplate,
          isActive: s.isActive ?? true,
        })),
      } : undefined,
    },
    include: { steps: true },
  });

  return NextResponse.json(created);
}

// DELETE /api/welcome-series?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.welcomeSeries.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
