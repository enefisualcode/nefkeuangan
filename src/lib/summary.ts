import { prisma } from "@/lib/prisma";
import { currentPeriodRange, dateKey, jakartaToday } from "@/lib/period";

const HARI_SIKLUS = 25;

const fmtTgl = (d: Date, opt: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString("id-ID", { ...opt, timeZone: "UTC" });

export type Transaksi = {
  id: string;
  amount: number;
  category: string;
  merchant: string | null;
  note: string | null;
  paymentType: string | null;
};

export async function getSummary(userId: string) {
  const { start, end } = currentPeriodRange();
  const today = jakartaToday();
  const todayKey = dateKey(today);

  const [periode, payLaterSemua] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", paymentType: "Pay Later" },
      _sum: { amount: true },
    }),
  ]);

  const totalPeriode = periode.reduce((s, t) => s + t.amount, 0);

  // Transaksi dikelompokkan per hari untuk pemilih hari dan grafik.
  const perHari = new Map<string, Transaksi[]>();
  for (const t of periode) {
    const k = dateKey(t.date);
    if (!perHari.has(k)) perHari.set(k, []);
    perHari.get(k)!.push({
      id: t.id,
      amount: t.amount,
      category: t.category,
      merchant: t.merchant,
      note: t.note,
      paymentType: t.paymentType,
    });
  }

  // Hitung dari tanggalnya saja - `end` menyimpan jam 23:59:59 agar pencarian
  // transaksi mencakup hari terakhir, dan itu tidak boleh dihitung sehari lagi.
  const akhirTanggal = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );
  const totalHari = Math.round((akhirTanggal - start.getTime()) / 864e5) + 1;
  const hariKe = Math.max(
    1,
    Math.round((today.getTime() - start.getTime()) / 864e5) + 1
  );

  // Deret hari dari awal periode sampai hari ini, termasuk hari tanpa transaksi
  // supaya grafiknya menggambarkan jeda dengan jujur.
  const hari = Array.from({ length: hariKe }, (_, i) => {
    const t = new Date(start.getTime() + i * 864e5);
    const k = dateKey(t);
    const daftar = perHari.get(k) ?? [];
    return {
      key: k,
      total: daftar.reduce((s, x) => s + x.amount, 0),
      labelPendek: fmtTgl(t, { day: "numeric", month: "short" }),
      labelPilih:
        (k === todayKey ? "Hari ini · " : "") +
        fmtTgl(t, { weekday: "short", day: "numeric", month: "short" }),
      labelPanjang: fmtTgl(t, { weekday: "long", day: "numeric", month: "long" }),
      hariIni: k === todayKey,
    };
  });

  // Rata-rata dihitung dari hari yang benar-benar ada transaksinya, bukan dari
  // seluruh hari berjalan - hari kosong tidak ikut menurunkan angkanya.
  const hariAktif = perHari.size;
  const rata = hariAktif ? totalPeriode / hariAktif : 0;

  const totalHariIni = perHari.get(todayKey)?.reduce((s, t) => s + t.amount, 0) ?? 0;
  const selisih = totalHariIni - rata;
  const persen = rata ? Math.abs((selisih / rata) * 100) : 0;

  const puncak = Math.max(...hari.map((h) => h.total), 0);
  const terboros = hari.find((h) => h.total === puncak && puncak > 0) ?? null;

  return {
    periodeLabel:
      fmtTgl(start, { day: "numeric", month: "short" }) +
      " – " +
      fmtTgl(end, { day: "numeric", month: "short", year: "numeric" }),
    todayKey,
    todayLabel: fmtTgl(today, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    totalHariIni,
    persen,
    diAtas: selisih > 0,
    payLater: payLaterSemua._sum.amount ?? 0,
    rata,
    hariAktif,
    totalPeriode,
    hariKe,
    totalHari,
    hari,
    transaksiPerHari: Object.fromEntries(perHari),
    puncak,
    terborosLabel: terboros?.labelPanjang ?? null,
    jumlahHariIni: perHari.get(todayKey)?.length ?? 0,
    jumlahPeriode: periode.length,
    siklus: HARI_SIKLUS,
    periodeAwalKey: start.toISOString().slice(0, 10),
  };
}

export type Ringkasan = Awaited<ReturnType<typeof getSummary>>;
