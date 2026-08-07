"use client";

import { useEffect, useState } from "react";

type Pilihan = "light" | "dark" | "sistem";

const WARNA_BAR: Record<"light" | "dark", string> = {
  light: "#F4F6FA",
  dark: "#0B1220",
};

function temaSistem(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function pasang(tema: "light" | "dark") {
  document.documentElement.setAttribute("data-tema", tema);
  // Warna bar atas ponsel ikut menyesuaikan, kalau tidak akan terlihat
  // sebagai garis gelap di atas halaman terang.
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", WARNA_BAR[tema]));
}

export function PilihTema() {
  const [pilihan, setPilihan] = useState<Pilihan>("sistem");

  useEffect(() => {
    const tersimpan = localStorage.getItem("tema");
    setPilihan(tersimpan === "light" || tersimpan === "dark" ? tersimpan : "sistem");
  }, []);

  // Saat mengikuti sistem, perubahan setelan ponsel langsung diikuti.
  useEffect(() => {
    if (pilihan !== "sistem") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const ubah = () => pasang(temaSistem());
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, [pilihan]);

  function pilih(p: Pilihan) {
    setPilihan(p);
    if (p === "sistem") {
      localStorage.removeItem("tema");
      pasang(temaSistem());
    } else {
      localStorage.setItem("tema", p);
      pasang(p);
    }
  }

  const daftar: [Pilihan, string][] = [
    ["light", "☀ Terang"],
    ["dark", "🌙 Gelap"],
    ["sistem", "⚙ Sistem"],
  ];

  return (
    <div
      className="rounded-[14px] px-[15px] py-3.5"
      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
    >
      <p
        className="mono mb-2.5 text-[10px] uppercase tracking-[0.13em]"
        style={{ color: "var(--faint)" }}
      >
        Tampilan
      </p>
      <div className="flex gap-2">
        {daftar.map(([nilai, label]) => {
          const aktif = pilihan === nilai;
          return (
            <button
              key={nilai}
              type="button"
              onClick={() => pilih(nilai)}
              aria-pressed={aktif}
              className="mono flex-1 rounded-[10px] py-2 text-[11px] whitespace-nowrap"
              style={{
                background: aktif ? "var(--blue-lembut)" : "var(--surface-2)",
                color: aktif ? "var(--blue)" : "var(--muted)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
