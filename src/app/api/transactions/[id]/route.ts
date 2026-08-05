import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveActingUserId } from "@/lib/resolveUser";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await resolveActingUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...(body.type ? { type: body.type } : {}),
      ...(body.amount !== undefined ? { amount: Math.round(Number(body.amount)) } : {}),
      ...(body.category ? { category: body.category } : {}),
      ...(body.merchant !== undefined ? { merchant: body.merchant } : {}),
      ...(body.note !== undefined ? { note: body.note } : {}),
      ...(body.paymentType !== undefined ? { paymentType: body.paymentType } : {}),
      ...(body.date ? { date: new Date(body.date) } : {}),
    },
  });

  return NextResponse.json({ transaction });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await resolveActingUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
