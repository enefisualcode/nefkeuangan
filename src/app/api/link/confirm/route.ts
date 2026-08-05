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

  // Kalau akun Telegram ini sudah terpakai di akun web lain, koneksinya
  // dipindah - bukan ditolak. Pengirim /link terbukti menguasai akun Telegram
  // ini sekaligus akun web tujuan (kodenya dibuat dari sana), jadi ini memang
  // alur "ganti akun" yang dijanjikan perintah /info.
  const [, user] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { telegramId: String(telegramId), NOT: { id: linkCode.userId } },
      data: { telegramId: null, telegramUsername: null },
    }),
    prisma.user.update({
      where: { id: linkCode.userId },
      data: {
        telegramId: String(telegramId),
        telegramUsername: telegramUsername ?? null,
      },
    }),
    prisma.linkCode.update({
      where: { code },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, email: user.email });
}
