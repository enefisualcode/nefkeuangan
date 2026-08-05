import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const botKey = process.env.BOT_SERVICE_KEY;
  if (!botKey || authHeader !== `Bearer ${botKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { telegramId } = await req.json();
  if (!telegramId) {
    return NextResponse.json({ error: "telegramId wajib diisi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });

  return NextResponse.json({
    linked: !!user,
    email: user?.email ?? null,
  });
}
