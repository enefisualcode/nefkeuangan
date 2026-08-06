import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password baru minimal 8 karakter." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Akun tidak valid." }, { status: 400 });
  }

  // Password lama tetap diminta supaya sesi yang tertinggal terbuka di
  // perangkat lain tidak bisa dipakai mengambil alih akun.
  const cocok = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
  if (!cocok) {
    return NextResponse.json({ error: "Password lama salah." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  return NextResponse.json({ ok: true });
}
