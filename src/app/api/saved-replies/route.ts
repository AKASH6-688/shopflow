import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { ownerId: userId } });
  return store?.id;
}

// GET /api/saved-replies
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const replies = await prisma.savedReply.findMany({
    where: { storeId },
    orderBy: { usageCount: "desc" },
  });

  return NextResponse.json(replies);
}

// POST /api/saved-replies - Create or update or increment usage
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId((session.user as any).id);
  if (!storeId) return NextResponse.json({ error: "No store found" }, { status: 404 });

  const { action, replyId, name, shortcut, content, category } = await req.json();

  // Increment usage
  if (action === "use" && replyId) {
    const reply = await prisma.savedReply.update({
      where: { id: replyId },
      data: { usageCount: { increment: 1 } },
    });
    return NextResponse.json(reply);
  }

  // Update
  if (action === "update" && replyId) {
    const reply = await prisma.savedReply.update({
      where: { id: replyId },
      data: { name, shortcut, content, category },
    });
    return NextResponse.json(reply);
  }

  // Create
  if (!name || !content) {
    return NextResponse.json({ error: "Name and content required" }, { status: 400 });
  }

  const reply = await prisma.savedReply.create({
    data: { storeId, name, shortcut: shortcut || "", content, category: category || "General" },
  });

  return NextResponse.json(reply);
}

// DELETE
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.savedReply.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
