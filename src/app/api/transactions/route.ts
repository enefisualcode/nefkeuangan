import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveActingUserId } from "@/lib/resolveUser";

export async function GET(req: Request) {
  const userId = await resolveActingUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      ...(type ? { type: type as "EXPENSE" | "INCOME" } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: Request) {
  const userId = await resolveActingUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, amount, category, merchant, source, note, paymentType, date } = body;

  if (!type || !amount || !category) {
    return NextResponse.json(
      { error: "type, amount, dan category wajib diisi." },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type,
      amount: Math.round(Number(amount)),
      category,
      merchant: merchant ?? null,
      source: source ?? "web",
      note: note ?? null,
      paymentType: paymentType ?? null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
