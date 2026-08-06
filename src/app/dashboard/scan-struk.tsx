"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";

type Hasil = {
  merchant: string | null;
  date: string;
  amount: number;
  category: string;
};

const kotak = { background: "var(--surface)", border: "1px solid var(--line)" } as const;

export function ScanStruk() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [membaca, setMembaca] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [tipeBayar, setTipeBayar] = useState("Cash");
  const [pesan, setPesan] = useState("");

  async function pilihGambar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya memilih foto yang sama lagi tetap memicu onChange
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
      setHasil(data);
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
    setMenyimpan(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "EXPENSE",
        amount: hasil.amount,
        category: hasil.category,
        merchant: hasil.merchant,
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
    batal();
    router.refresh();
  }

  function batal() {
    setHasil(null);
    setPratinjau(null);
    setPesan("");
  }

  const pilihan = (aktif: boolean, warna: "blue" | "orange") => ({
    background: aktif
      ? warna === "blue"
        ? "rgba(84,168,255,.15)"
        : "rgba(255,120,71,.15)"
      : "var(--surface-2)",
    color: aktif ? (warna === "blue" ? "var(--blue)" : "var(--orange-deep)") : "var(--muted)",
  });

  return (
    <div className="mx-5 mt-2.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={pilihGambar}
        className="hidden"
      />

      {!hasil && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={membaca}
          className="mono block w-full rounded-[14px] py-3 text-[12px] tracking-wide disabled:opacity-60"
          style={{ ...kotak, color: "var(--blue)" }}
        >
          {membaca ? "Membaca struk..." : "📸 Scan struk"}
        </button>
      )}

      {pesan && (
        <p
          className="mt-2 rounded-[14px] px-[15px] py-3 text-[12px] leading-relaxed"
          style={{ ...kotak, color: "var(--orange-deep)" }}
        >
          {pesan}
        </p>
      )}

      {hasil && (
        <div className="space-y-2.5 rounded-[14px] p-4" style={kotak}>
          <p className="mono text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--faint)" }}>
            Hasil baca struk
          </p>

          {pratinjau && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pratinjau}
              alt="Struk yang dipindai"
              className="max-h-40 w-full rounded-[10px] object-contain"
              style={{ background: "var(--surface-2)" }}
            />
          )}

          <div className="space-y-1.5 text-[13px]">
            <Baris label="Merchant" nilai={hasil.merchant ?? "-"} />
            <Baris label="Tanggal" nilai={hasil.date} />
            <Baris label="Kategori" nilai={hasil.category} />
            <div className="flex items-baseline justify-between gap-3 pt-1">
              <span className="text-[12px]" style={{ color: "var(--faint)" }}>
                Nominal
              </span>
              <span className="mono text-[17px] font-semibold tabular-nums">
                {formatRupiah(hasil.amount)}
              </span>
            </div>
          </div>

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

          <div className="flex gap-2">
            <button
              onClick={batal}
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

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[12px]" style={{ color: "var(--faint)" }}>
        {label}
      </span>
      <span className="text-right">{nilai}</span>
    </div>
  );
}
