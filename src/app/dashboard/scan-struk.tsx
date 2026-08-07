"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Hasil = {
  merchant: string;
  date: string;
  amount: string;
  category: string;
};

const KATEGORI = ["Makan", "Transport", "Belanja", "Tagihan", "Parkir", "Lainnya"];

const kotak = { background: "var(--surface)", border: "1px solid var(--line)" } as const;
const isian = "w-full rounded-[10px] px-3 py-2 text-[13px] outline-none";
const gayaIsian = { background: "var(--surface-2)", color: "var(--text)" };

export function ScanStruk() {
  const router = useRouter();
  const kameraRef = useRef<HTMLInputElement>(null);
  const galeriRef = useRef<HTMLInputElement>(null);

  const [membaca, setMembaca] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [tipeBayar, setTipeBayar] = useState("Cash");
  const [pesan, setPesan] = useState("");

  async function bacaGambar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya memilih berkas yang sama lagi tetap memicu onChange
    if (!file) return;

    setPesan("");
    setHasil(null);
    setPratinjau(URL.createObjectURL(file));
    setMembaca(true);

    const form = new FormData();
    form.append("image", file);

    try {
      const res = await fetch("/api/receipts/parse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setPesan(data.error ?? "Gagal membaca struk.");
        setPratinjau(null);
        return;
      }
      setHasil({
        merchant: data.merchant ?? "",
        date: data.date,
        amount: String(data.amount),
        category: KATEGORI.includes(data.category) ? data.category : "Lainnya",
      });
      setTipeBayar("Cash");
    } catch {
      setPesan("Gagal menghubungi server. Coba lagi.");
      setPratinjau(null);
    } finally {
      setMembaca(false);
    }
  }

  async function simpan() {
    if (!hasil) return;
    const angka = Number(hasil.amount.replace(/\D/g, ""));
    if (!angka) {
      setPesan("Nominal harus diisi.");
      return;
    }

    setMenyimpan(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "EXPENSE",
        amount: angka,
        category: hasil.category,
        merchant: hasil.merchant || null,
        date: hasil.date,
        source: "Struk",
        paymentType: tipeBayar,
      }),
    });
    setMenyimpan(false);

    if (!res.ok) {
      setPesan("Gagal menyimpan transaksi.");
      return;
    }
    tutup();
    router.refresh();
  }

  function tutup() {
    setHasil(null);
    setPratinjau(null);
    setPesan("");
  }

  const pilihan = (aktif: boolean, warna: "blue" | "orange") => ({
    background: aktif
      ? warna === "blue"
        ? "var(--blue-lembut)"
        : "var(--oranye-lembut)"
      : "var(--surface-2)",
    color: aktif ? (warna === "blue" ? "var(--blue)" : "var(--orange-deep)") : "var(--muted)",
  });

  const ubah = (k: keyof Hasil, v: string) => setHasil((h) => (h ? { ...h, [k]: v } : h));

  return (
    <div className="mx-5 mt-2.5">
      <input
        ref={kameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={bacaGambar}
        className="hidden"
      />
      <input
        ref={galeriRef}
        type="file"
        accept="image/*"
        onChange={bacaGambar}
        className="hidden"
      />

      {!hasil && (
        <div className="flex gap-2">
          <button
            onClick={() => kameraRef.current?.click()}
            disabled={membaca}
            className="mono flex-1 rounded-[14px] py-3 text-[12px] tracking-wide disabled:opacity-60"
            style={{ ...kotak, color: "var(--blue)" }}
          >
            {membaca ? "Membaca..." : "📸 Foto struk"}
          </button>
          <button
            onClick={() => galeriRef.current?.click()}
            disabled={membaca}
            className="mono flex-1 rounded-[14px] py-3 text-[12px] tracking-wide disabled:opacity-60"
            style={{ ...kotak, color: "var(--blue)" }}
          >
            {membaca ? "Membaca..." : "🖼️ Unggah gambar"}
          </button>
        </div>
      )}

      {pesan && !hasil && (
        <p
          className="mt-2 rounded-[14px] px-[15px] py-3 text-[12px] leading-relaxed"
          style={{
            background: "var(--oranye-samar)",
            border: "1px solid var(--oranye-garis)",
            color: "var(--orange-deep)",
          }}
        >
          {pesan}
        </p>
      )}

      {hasil && (
        <div className="space-y-2.5 rounded-[14px] p-4" style={kotak}>
          <p
            className="mono text-[10px] uppercase tracking-[0.13em]"
            style={{ color: "var(--faint)" }}
          >
            Hasil baca struk
          </p>

          {pratinjau && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pratinjau}
              alt="Struk yang dipindai"
              className="max-h-36 w-full rounded-[10px] object-contain"
              style={{ background: "var(--surface-2)" }}
            />
          )}

          <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Periksa dulu — hasil pindai kadang meleset, terutama tanggal. Semua isian
            di bawah bisa kamu ubah.
          </p>

          <Label teks="Nominal">
            <input
              type="text"
              inputMode="numeric"
              value={hasil.amount}
              onChange={(e) => ubah("amount", e.target.value)}
              className={isian}
              style={gayaIsian}
            />
          </Label>

          <Label teks="Tanggal">
            <input
              type="date"
              value={hasil.date}
              onChange={(e) => ubah("date", e.target.value)}
              className={isian}
              style={gayaIsian}
            />
          </Label>

          <Label teks="Kategori">
            <select
              value={hasil.category}
              onChange={(e) => ubah("category", e.target.value)}
              className={isian}
              style={gayaIsian}
            >
              {KATEGORI.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Label>

          <Label teks="Merchant">
            <input
              type="text"
              value={hasil.merchant}
              onChange={(e) => ubah("merchant", e.target.value)}
              placeholder="Nama toko / tempat"
              className={isian}
              style={gayaIsian}
            />
          </Label>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setTipeBayar("Cash")}
              className="mono flex-1 rounded-[10px] py-2 text-[11px]"
              style={pilihan(tipeBayar === "Cash", "blue")}
            >
              💵 Cash
            </button>
            <button
              type="button"
              onClick={() => setTipeBayar("Pay Later")}
              className="mono flex-1 rounded-[10px] py-2 text-[11px]"
              style={pilihan(tipeBayar === "Pay Later", "orange")}
            >
              💳 Pay Later
            </button>
          </div>

          {pesan && (
            <p className="text-[12px]" style={{ color: "var(--orange-deep)" }}>
              {pesan}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={tutup}
              className="mono flex-1 rounded-[10px] py-2 text-[11px]"
              style={{ background: "var(--surface-2)", color: "var(--muted)" }}
            >
              Batal
            </button>
            <button
              onClick={simpan}
              disabled={menyimpan}
              className="mono flex-1 rounded-[10px] py-2 text-[11px] disabled:opacity-50"
              style={{ background: "var(--surface-2)", color: "var(--blue)" }}
            >
              {menyimpan ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ teks, children }: { teks: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="mono text-[10px] uppercase tracking-[0.13em]"
        style={{ color: "var(--faint)" }}
      >
        {teks}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
