import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { resolveActingUserId } from "@/lib/resolveUser";
import { jakartaToday, dateKey } from "@/lib/period";

const BATAS_UKURAN = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  const userId = await resolveActingUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Fitur scan struk belum diaktifkan (GEMINI_API_KEY belum diisi)." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Gambar struk belum dikirim." }, { status: 400 });
  }
  if (file.size > BATAS_UKURAN) {
    return NextResponse.json(
      { error: "Ukuran gambar terlalu besar (maksimal 8 MB)." },
      { status: 413 }
    );
  }

  const hariIni = dateKey(jakartaToday());

  // Prompt disamakan dengan yang dipakai bot Telegram supaya hasil bacanya
  // konsisten dari mana pun struk dikirim.
  const prompt = `
Kamu adalah asisten yang membaca struk belanja/pembayaran.
Hari ini adalah ${hariIni}. Gunakan ini sebagai acuan tahun,
JANGAN menebak tahun lain kecuali struk mencantumkan tahun dengan jelas.

Baca gambar struk ini dan balas dengan JSON saja, tanpa teks lain,
tanpa markdown backticks:

{
    "merchant": "nama toko/tempat",
    "tanggal": "YYYY-MM-DD (kalau tidak jelas gunakan ${hariIni})",
    "nominal": angka_total_tanpa_titik_atau_koma,
    "kategori": "Makan / Transport / Belanja / Tagihan / Lainnya"
}

Ambil TOTAL akhir yang dibayar.
Jika gambar berisi LEBIH DARI SATU struk, isi nominal dengan -1.
Jika gambar tidak jelas atau bukan struk, isi nominal dengan 0.
`.trim();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const hasil = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type || "image/jpeg", data: base64 } },
          ],
        },
      ],
    });

    const teks = (hasil.text ?? "").replace(/^```json\s*|\s*```$/g, "").trim();
    let data: { merchant?: string; tanggal?: string; nominal?: number; kategori?: string };
    try {
      data = JSON.parse(teks);
    } catch {
      return NextResponse.json(
        { error: "Struk tidak terbaca jelas. Coba foto ulang lebih dekat." },
        { status: 422 }
      );
    }

    const nominal = Number(data.nominal ?? 0);

    if (nominal === -1) {
      return NextResponse.json(
        {
          error:
            "Sepertinya ada beberapa struk dalam satu gambar. Kirim satu foto untuk satu struk supaya nominalnya akurat.",
        },
        { status: 422 }
      );
    }
    if (!nominal || nominal <= 0) {
      return NextResponse.json(
        { error: "Struk tidak terbaca jelas. Coba foto ulang lebih dekat, atau catat manual." },
        { status: 422 }
      );
    }

    const tanggal =
      typeof data.tanggal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.tanggal)
        ? data.tanggal
        : hariIni;

    return NextResponse.json({
      merchant: data.merchant?.trim() || null,
      date: tanggal,
      amount: Math.round(nominal),
      category: data.kategori?.trim() || "Lainnya",
    });
  } catch (e) {
    console.error("Gagal membaca struk:", e);
    return NextResponse.json(
      { error: "Gagal membaca struk. Coba lagi beberapa saat." },
      { status: 502 }
    );
  }
}
