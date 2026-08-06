import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type BarisLaporan = {
  date: Date;
  type: "EXPENSE" | "INCOME";
  amount: number;
  category: string;
  merchant: string | null;
  note: string | null;
  paymentType: string | null;
};

// Font bawaan PDF memakai encoding WinAnsi yang tidak mengenal emoji maupun
// huruf di luar Latin-1. Kategori dari bot mengandung emoji, jadi teks
// dibersihkan dulu supaya pembuatan PDF tidak gagal di tengah jalan.
function bersihkan(teks: string | null | undefined) {
  if (!teks) return "";
  return teks
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();
}

function rupiah(n: number) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

function tanggalPendek(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function tanggalPanjang(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Potong teks agar muat di lebar kolom, tambahkan elipsis bila perlu. */
function potong(teks: string, font: PDFFont, ukuran: number, lebar: number) {
  if (font.widthOfTextAtSize(teks, ukuran) <= lebar) return teks;
  let hasil = teks;
  while (hasil.length > 1 && font.widthOfTextAtSize(hasil + "...", ukuran) > lebar) {
    hasil = hasil.slice(0, -1);
  }
  return hasil + "...";
}

const A4 = { lebar: 595.28, tinggi: 841.89 };
const MARGIN = 40;
const ISI = A4.lebar - MARGIN * 2;

const warna = {
  teks: rgb(0.09, 0.13, 0.2),
  redup: rgb(0.42, 0.48, 0.57),
  garis: rgb(0.85, 0.87, 0.9),
  masuk: rgb(0.05, 0.5, 0.35),
  keluar: rgb(0.78, 0.29, 0.16),
  kepalaTabel: rgb(0.95, 0.96, 0.97),
};

const KOLOM = [
  { judul: "Tanggal", lebar: 58, rata: "kiri" as const },
  { judul: "Kategori", lebar: 78, rata: "kiri" as const },
  { judul: "Keterangan", lebar: 176, rata: "kiri" as const },
  { judul: "Bayar", lebar: 48, rata: "kiri" as const },
  { judul: "Masuk", lebar: 77, rata: "kanan" as const },
  { judul: "Keluar", lebar: 78, rata: "kanan" as const },
];

export async function buatLaporanPdf(opts: {
  email: string;
  dari: string;
  sampai: string;
  baris: BarisLaporan[];
}) {
  const { email, dari, sampai, baris } = opts;

  const pdf = await PDFDocument.create();
  const reguler = await pdf.embedFont(StandardFonts.Helvetica);
  const tebal = await pdf.embedFont(StandardFonts.HelveticaBold);

  const masuk = baris.filter((b) => b.type === "INCOME");
  const keluar = baris.filter((b) => b.type === "EXPENSE");
  const totalMasuk = masuk.reduce((s, b) => s + b.amount, 0);
  const totalKeluar = keluar.reduce((s, b) => s + b.amount, 0);
  const selisih = totalMasuk - totalKeluar;

  const perKategori = new Map<string, number>();
  for (const b of keluar) {
    const k = bersihkan(b.category) || "Lainnya";
    perKategori.set(k, (perKategori.get(k) ?? 0) + b.amount);
  }
  const kategoriUrut = [...perKategori.entries()].sort((a, b) => b[1] - a[1]);

  let halaman: PDFPage = pdf.addPage([A4.lebar, A4.tinggi]);
  let y = A4.tinggi - MARGIN;

  const tulis = (
    teks: string,
    x: number,
    posY: number,
    ukuran: number,
    font: PDFFont,
    color = warna.teks
  ) => halaman.drawText(teks, { x, y: posY, size: ukuran, font, color });

  const garis = (posY: number) =>
    halaman.drawLine({
      start: { x: MARGIN, y: posY },
      end: { x: MARGIN + ISI, y: posY },
      thickness: 0.6,
      color: warna.garis,
    });

  // ---------- kepala ----------
  tulis("Laporan Arus Kas", MARGIN, y - 18, 19, tebal);
  y -= 40;
  tulis(`${tanggalPanjang(dari)}  -  ${tanggalPanjang(sampai)}`, MARGIN, y, 10.5, reguler, warna.redup);
  y -= 14;
  tulis(bersihkan(email), MARGIN, y, 9, reguler, warna.redup);
  y -= 22;
  garis(y);
  y -= 24;

  // ---------- ringkasan ----------
  const kartuLebar = (ISI - 16) / 3;
  const ringkasan: [string, string, ReturnType<typeof rgb>][] = [
    ["Total Pemasukan", rupiah(totalMasuk), warna.masuk],
    ["Total Pengeluaran", rupiah(totalKeluar), warna.keluar],
    ["Selisih", (selisih < 0 ? "-" : "") + rupiah(Math.abs(selisih)), selisih < 0 ? warna.keluar : warna.masuk],
  ];

  ringkasan.forEach(([label, nilai, c], i) => {
    const x = MARGIN + i * (kartuLebar + 8);
    halaman.drawRectangle({
      x,
      y: y - 46,
      width: kartuLebar,
      height: 46,
      borderColor: warna.garis,
      borderWidth: 0.8,
    });
    tulis(label, x + 10, y - 17, 8, reguler, warna.redup);
    tulis(nilai, x + 10, y - 36, 13, tebal, c);
  });
  y -= 66;

  tulis(
    `${baris.length} transaksi  -  ${masuk.length} pemasukan, ${keluar.length} pengeluaran`,
    MARGIN,
    y,
    8.5,
    reguler,
    warna.redup
  );
  y -= 24;

  // ---------- pengeluaran per kategori ----------
  if (kategoriUrut.length) {
    tulis("Pengeluaran per Kategori", MARGIN, y, 11, tebal);
    y -= 16;
    for (const [kat, jml] of kategoriUrut) {
      if (y < MARGIN + 80) break; // sisakan ruang; sisanya tetap terwakili di tabel
      const persen = totalKeluar ? Math.round((jml / totalKeluar) * 100) : 0;
      tulis(potong(kat, reguler, 9.5, 150), MARGIN, y, 9.5, reguler);
      const batangLebar = 150;
      halaman.drawRectangle({
        x: MARGIN + 165,
        y: y - 1,
        width: batangLebar,
        height: 6,
        color: rgb(0.93, 0.94, 0.95),
      });
      halaman.drawRectangle({
        x: MARGIN + 165,
        y: y - 1,
        width: Math.max(1, (batangLebar * jml) / (kategoriUrut[0][1] || 1)),
        height: 6,
        color: rgb(1, 0.6, 0.24),
      });
      const teksJml = `${rupiah(jml)}  (${persen}%)`;
      tulis(
        teksJml,
        MARGIN + ISI - reguler.widthOfTextAtSize(teksJml, 9.5),
        y,
        9.5,
        reguler,
        warna.redup
      );
      y -= 15;
    }
    y -= 10;
  }

  // ---------- tabel transaksi ----------
  const kepalaTabel = () => {
    halaman.drawRectangle({
      x: MARGIN,
      y: y - 4,
      width: ISI,
      height: 18,
      color: warna.kepalaTabel,
    });
    let x = MARGIN + 6;
    KOLOM.forEach((k) => {
      const teks = k.judul;
      const lebarTeks = tebal.widthOfTextAtSize(teks, 8);
      tulis(
        teks,
        k.rata === "kanan" ? x + k.lebar - 12 - lebarTeks : x,
        y + 1,
        8,
        tebal,
        warna.redup
      );
      x += k.lebar;
    });
    y -= 22;
  };

  const halamanBaru = () => {
    halaman = pdf.addPage([A4.lebar, A4.tinggi]);
    y = A4.tinggi - MARGIN;
    kepalaTabel();
  };

  tulis("Rincian Transaksi", MARGIN, y, 11, tebal);
  y -= 18;
  kepalaTabel();

  const urut = [...baris].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const b of urut) {
    if (y < MARGIN + 40) halamanBaru();

    const keterangan =
      [bersihkan(b.merchant), bersihkan(b.note)].filter(Boolean).join(" - ") || "-";
    const nilai = rupiah(b.amount);

    const sel: string[] = [
      tanggalPendek(b.date),
      bersihkan(b.category) || "-",
      keterangan,
      bersihkan(b.paymentType) || "-",
      b.type === "INCOME" ? nilai : "",
      b.type === "EXPENSE" ? nilai : "",
    ];

    let x = MARGIN + 6;
    sel.forEach((teks, i) => {
      const k = KOLOM[i];
      const ukuran = 8.5;
      const c = i === 4 ? warna.masuk : i === 5 ? warna.keluar : warna.teks;
      const dipotong = potong(teks, reguler, ukuran, k.lebar - 12);
      const lebarTeks = reguler.widthOfTextAtSize(dipotong, ukuran);
      tulis(
        dipotong,
        k.rata === "kanan" ? x + k.lebar - 12 - lebarTeks : x,
        y,
        ukuran,
        reguler,
        c
      );
      x += k.lebar;
    });

    y -= 14;
    garis(y + 5);
  }

  // ---------- baris total ----------
  if (y < MARGIN + 40) halamanBaru();
  y -= 6;
  halaman.drawRectangle({ x: MARGIN, y: y - 4, width: ISI, height: 18, color: warna.kepalaTabel });
  tulis("TOTAL", MARGIN + 6, y + 1, 8.5, tebal);
  {
    let x = MARGIN + 6;
    KOLOM.forEach((k, i) => {
      if (i === 4 || i === 5) {
        const teks = rupiah(i === 4 ? totalMasuk : totalKeluar);
        const lebarTeks = tebal.widthOfTextAtSize(teks, 8.5);
        tulis(teks, x + k.lebar - 12 - lebarTeks, y + 1, 8.5, tebal, i === 4 ? warna.masuk : warna.keluar);
      }
      x += k.lebar;
    });
  }

  // ---------- nomor halaman ----------
  const semua = pdf.getPages();
  semua.forEach((hal, i) => {
    const teks = `Halaman ${i + 1} dari ${semua.length}  -  dibuat ${new Date().toLocaleDateString(
      "id-ID",
      { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }
    )}`;
    hal.drawText(teks, {
      x: MARGIN,
      y: 24,
      size: 7.5,
      font: reguler,
      color: warna.redup,
    });
  });

  return pdf.save();
}
