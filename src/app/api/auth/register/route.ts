import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, storeName } = await req.json();

    if (!name || !email || !password || !storeName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        stores: {
          create: {
            name: storeName,
          },
        },
      },
      include: { stores: true },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      storeName: user.stores[0]?.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
