import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const botKey = process.env.BOT_SERVICE_KEY;
  if (!botKey || authHeader !== `Bearer ${botKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, telegramId, telegramUsername } = await req.json();
  if (!code || !telegramId) {
    return NextResponse.json({ error: "code dan telegramId wajib diisi" }, { status: 400 });
  }

  const linkCode = await prisma.linkCode.findUnique({ where: { code } });
  if (!linkCode || linkCode.usedAt || linkCode.expiresAt < new Date()) {
    return NextResponse.json({ error: "Kode tidak valid atau sudah kedaluwarsa" }, { status: 400 });
  }

  const takenByOther = await prisma.user.findFirst({
    where: { telegramId: String(telegramId), NOT: { id: linkCode.userId } },
  });
  if (takenByOther) {
    return NextResponse.json(
      { error: "Akun Telegram ini sudah terhubung ke akun lain" },
      { status: 409 }
    );
  }

  const user = await prisma.user.update({
    where: { id: linkCode.userId },
    data: { telegramId: String(telegramId), telegramUsername: telegramUsername ?? null },
  });

  await prisma.linkCode.update({
    where: { code },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ ok: true, email: user.email });
}
