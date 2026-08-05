import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function randomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = randomCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.linkCode.create({
    data: { code, userId: session.user.id, expiresAt },
  });

  return NextResponse.json({ code, expiresAt });
}
