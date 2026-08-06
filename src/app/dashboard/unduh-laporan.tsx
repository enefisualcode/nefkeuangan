"use client";

import { useState } from "react";

const kotak = { background: "var(--surface)", border: "1px solid var(--line)" } as const;
const isian = "w-full rounded-[10px] px-3 py-2 text-[13px] outline-none";
const gayaIsian = { background: "var(--surface-2)", color: "var(--text)" };

/** Tanggal hari ini menurut kalender Jakarta, bukan zona perangkat. */
function hariIniWIB() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function geser(iso: string, hari: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + hari));
  return t.toISOString().slice(0, 10);
}

/** Awal siklus 25-24 yang sedang berjalan. */
function awalPeriode(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + (d >= 25 ? 0 : -1), 25));
  return t.toISOString().slice(0, 10);
}

export function UnduhLaporan({ periodeAwal }: { periodeAwal: string }) {
  const kini = hariIniWIB();
  const [buka, setBuka] = useState(false);
  const [dari, setDari] = useState(periodeAwal);
  const [sampai, setSampai] = useState(kini);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");

  const cepat: [string, () => void][] = [
    ["Periode ini", () => (setDari(awalPeriode(kini)), setSampai(kini))],
    ["30 hari", () => (setDari(geser(kini, -29)), setSampai(kini))],
    ["90 hari", () => (setDari(geser(kini, -89)), setSampai(kini))],
    ["Tahun ini", () => (setDari(kini.slice(0, 4) + "-01-01"), setSampai(kini))],
  ];

  async function unduh() {
    setPesan("");
    if (dari > sampai) {
      setPesan("Tanggal awal tidak boleh melewati tanggal akhir.");
      return;
    }

    setSibuk(true);
    try {
      const res = await fetch(`/api/export/pdf?from=${dari}&to=${sampai}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPesan(data?.error ?? "Gagal membuat laporan.");
        return;
      }

      // Berkas diunduh lewat blob supaya nama berkasnya ikut terbawa.
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arus-kas-${dari}-sd-${sampai}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPesan("Laporan terunduh.");
    } catch {
      setPesan("Gagal menghubungi server. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  if (!buka) {
    return (
      <button
        onClick={() => setBuka(true)}
        className="mono mx-5 mt-2.5 block w-[calc(100%-2.5rem)] rounded-[14px] py-3 text-[12px] tracking-wide"
        style={{ ...kotak, color: "var(--blue)" }}
      >
        📄 Unduh laporan PDF
      </button>
    );
  }

  return (
    <div className="mx-5 mt-2.5 space-y-2.5 rounded-[14px] p-4" style={kotak}>
      <p className="mono text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--faint)" }}>
        Unduh laporan arus kas
      </p>

      <div className="flex flex-wrap gap-1.5">
        {cepat.map(([label, aksi]) => (
          <button
            key={label}
            type="button"
            onClick={aksi}
            className="mono rounded-[8px] px-2.5 py-1.5 text-[10.5px]"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <label className="block flex-1">
          <span className="mono text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--faint)" }}>
            Dari
          </span>
          <input
            type="date"
            value={dari}
            max={sampai}
            onChange={(e) => setDari(e.target.value)}
            className={`${isian} mt-1.5`}
            style={gayaIsian}
          />
        </label>
        <label className="block flex-1">
          <span className="mono text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--faint)" }}>
            Sampai
          </span>
          <input
            type="date"
            value={sampai}
            min={dari}
            onChange={(e) => setSampai(e.target.value)}
            className={`${isian} mt-1.5`}
            style={gayaIsian}
          />
        </label>
      </div>

      {pesan && (
        <p
          className="text-[12px]"
          style={{ color: pesan === "Laporan terunduh." ? "var(--blue)" : "var(--orange-deep)" }}
        >
          {pesan}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setBuka(false);
            setPesan("");
          }}
          className="mono flex-1 rounded-[10px] py-2 text-[11px]"
          style={{ background: "var(--surface-2)", color: "var(--muted)" }}
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={unduh}
          disabled={sibuk}
          className="mono flex-1 rounded-[10px] py-2 text-[11px] disabled:opacity-50"
          style={{ background: "var(--surface-2)", color: "var(--blue)" }}
        >
          {sibuk ? "Menyiapkan..." : "Unduh PDF"}
        </button>
      </div>
    </div>
  );
}
