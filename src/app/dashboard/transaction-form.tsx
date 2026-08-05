"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const KATEGORI_PENGELUARAN = ["Makan", "Transport", "Belanja", "Tagihan", "Lainnya"];
const KATEGORI_PEMASUKAN = ["Gaji", "Freelance", "Bonus", "Investasi", "Lainnya"];

export function TransactionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(KATEGORI_PENGELUARAN[0]);
  const [note, setNote] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = type === "EXPENSE" ? KATEGORI_PENGELUARAN : KATEGORI_PEMASUKAN;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount.replace(/\D/g, ""));
    if (!numAmount) {
      setError("Nominal harus diisi.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: numAmount,
        category,
        note,
        source: "web",
        ...(type === "EXPENSE" ? { paymentType } : {}),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      setError("Gagal menyimpan transaksi.");
      return;
    }

    setAmount("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500"
      >
        + Catat Transaksi
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl bg-neutral-900 p-4"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setType("EXPENSE");
            setCategory(KATEGORI_PENGELUARAN[0]);
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            type === "EXPENSE"
              ? "bg-red-500/20 text-red-300"
              : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => {
            setType("INCOME");
            setCategory(KATEGORI_PEMASUKAN[0]);
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            type === "INCOME"
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-neutral-800 text-neutral-400"
          }`}
        >
          Pemasukan
        </button>
      </div>

      <input
        type="text"
        inputMode="numeric"
        placeholder="Nominal (mis. 50000)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {type === "EXPENSE" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaymentType("Cash")}
            className={`flex-1 rounded-lg py-2 text-sm ${
              paymentType === "Cash"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            💵 Cash
          </button>
          <button
            type="button"
            onClick={() => setPaymentType("Pay Later")}
            className={`flex-1 rounded-lg py-2 text-sm ${
              paymentType === "Pay Later"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            💳 Pay Later
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Catatan (opsional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-lg bg-neutral-800 py-2 text-sm text-neutral-300"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
