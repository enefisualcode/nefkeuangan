"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const KATEGORI_PENGELUARAN = ["Makan", "Transport", "Belanja", "Tagihan", "Parkir", "Lainnya"];
const KATEGORI_PEMASUKAN = ["Gaji", "Freelance", "Bonus", "Investasi", "Lainnya"];

const kotak = { background: "var(--surface)", border: "1px solid var(--line)" } as const;
const isian = "w-full rounded-[10px] px-3 py-2 text-[13px] outline-none";
const gayaIsian = { background: "var(--surface-2)", color: "var(--text)" };

export function TransactionForm() {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [jenis, setJenis] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState(KATEGORI_PENGELUARAN[0]);
  const [merchant, setMerchant] = useState("");
  const [catatan, setCatatan] = useState("");
  const [tipeBayar, setTipeBayar] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const daftarKategori = jenis === "EXPENSE" ? KATEGORI_PENGELUARAN : KATEGORI_PEMASUKAN;

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const angka = Number(nominal.replace(/\D/g, ""));
    if (!angka) {
      setError("Nominal harus diisi.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: jenis,
        amount: angka,
        category: kategori,
        merchant: merchant || null,
        note: catatan || null,
        source: "Web",
        ...(jenis === "EXPENSE" ? { paymentType: tipeBayar } : {}),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      setError("Gagal menyimpan transaksi.");
      return;
    }

    setNominal("");
    setMerchant("");
    setCatatan("");
    setBuka(false);
    router.refresh();
  }

  if (!buka) {
    return (
      <button
        onClick={() => setBuka(true)}
        className="mono mx-5 mt-3 block w-[calc(100%-2.5rem)] rounded-[14px] py-3 text-[12px] tracking-wide"
        style={{ ...kotak, color: "var(--blue)" }}
      >
        + Catat transaksi
      </button>
    );
  }

  const pilihan = (aktif: boolean, warna: "blue" | "orange") => ({
    background: aktif
      ? warna === "blue"
        ? "rgba(84,168,255,.15)"
        : "rgba(255,120,71,.15)"
      : "var(--surface-2)",
    color: aktif
      ? warna === "blue"
        ? "var(--blue)"
        : "var(--orange-deep)"
      : "var(--muted)",
  });

  return (
    <form onSubmit={kirim} className="mx-5 mt-3 space-y-2.5 rounded-[14px] p-4" style={kotak}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setJenis("EXPENSE");
            setKategori(KATEGORI_PENGELUARAN[0]);
          }}
          className="mono flex-1 rounded-[10px] py-2 text-[11px]"
          style={pilihan(jenis === "EXPENSE", "orange")}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => {
            setJenis("INCOME");
            setKategori(KATEGORI_PEMASUKAN[0]);
          }}
          className="mono flex-1 rounded-[10px] py-2 text-[11px]"
          style={pilihan(jenis === "INCOME", "blue")}
        >
          Pemasukan
        </button>
      </div>

      <input
        type="text"
        inputMode="numeric"
        placeholder="Nominal (mis. 50000)"
        value={nominal}
        onChange={(e) => setNominal(e.target.value)}
        className={isian}
        style={gayaIsian}
      />

      <select
        value={kategori}
        onChange={(e) => setKategori(e.target.value)}
        className={isian}
        style={gayaIsian}
      >
        {daftarKategori.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Merchant / tempat (opsional)"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        className={isian}
        style={gayaIsian}
      />

      {jenis === "EXPENSE" && (
        <div className="flex gap-2">
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
      )}

      <input
        type="text"
        placeholder="Catatan (opsional)"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        className={isian}
        style={gayaIsian}
      />

      {error && (
        <p className="text-[12px]" style={{ color: "var(--orange-deep)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBuka(false)}
          className="mono flex-1 rounded-[10px] py-2 text-[11px]"
          style={{ background: "var(--surface-2)", color: "var(--muted)" }}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="mono flex-1 rounded-[10px] py-2 text-[11px] disabled:opacity-50"
          style={{ background: "var(--surface-2)", color: "var(--blue)" }}
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
