"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { formatRupiah } from "@/lib/format";
import type { Ringkasan } from "@/lib/summary";

const BATAS = 5;

export function RincianHarian({ data }: { data: Ringkasan }) {
  const [dipilih, setDipilih] = useState(data.todayKey);
  const [pakaiTip, setPakaiTip] = useState(false);
  const [semua, setSemua] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const kolomRef = useRef<Record<string, HTMLButtonElement | null>>({});

  const hariTerpilih = data.hari.find((h) => h.key === dipilih);
  const transaksi = [...(data.transaksiPerHari[dipilih] ?? [])].reverse();
  const tampil = semua ? transaksi : transaksi.slice(0, BATAS);

  // Tooltip diposisikan setelah tata letak selesai supaya tidak keluar
  // dari kotak grafik pada batang paling tinggi atau paling pinggir.
  useLayoutEffect(() => {
    const chart = chartRef.current;
    const tip = tipRef.current;
    const col = kolomRef.current[dipilih];
    if (!chart || !tip || !col || !pakaiTip) return;

    const H = chart.clientHeight;
    const total = hariTerpilih?.total ?? 0;
    const tinggiBatang = Math.max(total / (data.puncak || 1), 0.015) * H;
    let bawah = tinggiBatang + 8;
    if (bawah + tip.offsetHeight > H - 2) bawah = H - tip.offsetHeight - 2;
    tip.style.bottom = bawah + "px";

    const tengah = col.offsetLeft + col.offsetWidth / 2;
    const separuh = tip.offsetWidth / 2;
    tip.style.left =
      Math.min(Math.max(tengah, separuh), chart.clientWidth - separuh) + "px";
  }, [dipilih, pakaiTip, hariTerpilih, data.puncak]);

  // Saat halaman baru dibuka, hari ini tampil tanpa tooltip supaya bersih.
  // Begitu pengguna memilih hari sendiri, tooltip selalu ikut muncul.
  function pilih(key: string) {
    setDipilih(key);
    setPakaiTip(true);
    setSemua(false);
  }

  return (
    <>
      {/* ---------- pemilih hari ---------- */}
      <div className="mx-5 mt-8 mb-3 flex items-center gap-2.5">
        <h2 className="eyebrow whitespace-nowrap">
          {dipilih === data.todayKey
            ? "Rincian hari ini"
            : "Rincian " + (hariTerpilih?.labelPanjang ?? "")}
        </h2>
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        <select
          aria-label="Pilih hari"
          className="pilih-hari flex-none"
          value={dipilih}
          onChange={(e) => pilih(e.target.value)}
        >
          {[...data.hari].reverse().map((h) => (
            <option key={h.key} value={h.key}>
              {h.labelPilih}
            </option>
          ))}
        </select>
      </div>

      {/* ---------- daftar transaksi ---------- */}
      <div className="mx-5">
        {transaksi.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-6 text-center text-[13px] leading-relaxed"
            style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--muted)" }}
          >
            {dipilih === data.todayKey ? (
              <>
                Belum ada catatan hari ini.
                <br />
                Kirim struk atau <b className="text-[var(--text)]">/catat</b> lewat bot untuk mengisinya.
              </>
            ) : (
              "Tidak ada transaksi pada hari ini."
            )}
          </div>
        ) : (
          <>
            {tampil.map((t, i) => {
              const judul = t.merchant && t.merchant !== "-" ? t.merchant : t.category;
              const bagian = [t.category];
              if (t.note) bagian.push(t.note);
              if (t.paymentType === "Pay Later") bagian.push("Pay Later");
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3"
                  style={{
                    borderBottom:
                      i === tampil.length - 1 ? "none" : "1px solid var(--line)",
                  }}
                >
                  <span className="tanda">{t.category.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <div className="text-sm leading-tight">{judul}</div>
                    <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--faint)" }}>
                      {bagian.join(" · ")}
                    </div>
                  </span>
                  <span className="mono text-sm font-medium tabular-nums">
                    {formatRupiah(t.amount)}
                  </span>
                </div>
              );
            })}

            {transaksi.length > BATAS && (
              <button
                onClick={() => setSemua((v) => !v)}
                aria-expanded={semua}
                className="mono block w-full pt-3 pb-0.5 text-center text-[11px] tracking-wide"
                style={{ color: "var(--blue)" }}
              >
                {semua
                  ? "Tampilkan lebih sedikit ▴"
                  : `Lihat semua ${transaksi.length} transaksi (${transaksi.length - BATAS} lagi) ▾`}
              </button>
            )}
          </>
        )}
      </div>

      {/* ---------- grafik harian ---------- */}
      <h2 className="eyebrow judul-garis mx-5 mt-8 mb-3">Grafik harian</h2>
      <div
        className="mx-5 rounded-2xl px-4 pt-[18px] pb-3"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        <div className="chart" ref={chartRef}>
          <div
            ref={tipRef}
            className={"chart-tip" + (pakaiTip ? " tampil" : "")}
          >
            <span
              className="mono block text-[9px] uppercase tracking-[0.08em]"
              style={{ color: "var(--faint)" }}
            >
              {hariTerpilih?.labelPendek}
            </span>
            <span className="mono text-xs font-semibold" style={{ color: "var(--blue)" }}>
              {formatRupiah(hariTerpilih?.total ?? 0)}
            </span>
          </div>

          {data.hari.map((h) => {
            const kelas = [
              "col",
              h.hariIni ? "kini" : h.total === data.puncak && data.puncak > 0 ? "hi" : "",
              h.key === dipilih && pakaiTip ? "pilih" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={h.key}
                ref={(el) => {
                  kolomRef.current[h.key] = el;
                }}
                className={kelas}
                aria-label={`${h.labelPanjang}: ${formatRupiah(h.total)}`}
                onClick={() => pilih(h.key)}
              >
                <i
                  style={{
                    height: Math.max((h.total / (data.puncak || 1)) * 100, 1.5) + "%",
                  }}
                />
              </button>
            );
          })}
        </div>

        <div
          className="mono mt-2 flex justify-between text-[9.5px]"
          style={{ color: "var(--faint)" }}
        >
          <span>{data.hari[0]?.labelPendek}</span>
          <span>{data.hari[data.hari.length - 1]?.labelPendek}</span>
        </div>

        <p className="mx-0.5 mt-3 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
          Ketuk batang untuk lihat total &amp; rincian hari itu.
          {data.terborosLabel && (
            <>
              {" "}
              Paling boros <b className="font-semibold text-[var(--text)]">{data.terborosLabel}</b> —{" "}
              {formatRupiah(data.puncak)}.
            </>
          )}
        </p>
      </div>
    </>
  );
}
