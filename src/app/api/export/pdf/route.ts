import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buatLaporanPdf } from "@/lib/laporan-pdf";

export const runtime = "nodejs";

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dari = searchParams.get("from") ?? "";
  const sampai = searchParams.get("to") ?? "";

  if (!POLA_TANGGAL.test(dari) || !POLA_TANGGAL.test(sampai)) {
    return Response.json(
      { error: "Tanggal awal dan akhir wajib diisi (format YYYY-MM-DD)." },
      { status: 400 }
    );
  }
  if (dari > sampai) {
    return Response.json(
      { error: "Tanggal awal tidak boleh melewati tanggal akhir." },
      { status: 400 }
    );
  }

  // Tanggal transaksi disimpan sebagai tengah malam UTC, jadi rentangnya
  // dibandingkan pada patokan yang sama - bukan waktu server.
  const baris = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: new Date(`${dari}T00:00:00.000Z`), lte: new Date(`${sampai}T23:59:59.999Z`) },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      type: true,
      amount: true,
      category: true,
      merchant: true,
      note: true,
      paymentType: true,
    },
  });

  const pdf = await buatLaporanPdf({
    email: session.user.email ?? "",
    dari,
    sampai,
    baris,
  });

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="arus-kas-${dari}-sd-${sampai}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
