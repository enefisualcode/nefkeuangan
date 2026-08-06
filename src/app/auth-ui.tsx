"use client";

import { useState } from "react";

/** Kerangka bersama halaman masuk & daftar, memakai palet yang sama dengan dashboard. */
export function AuthShell({
  judul,
  keterangan,
  children,
}: {
  judul: string;
  keterangan: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col justify-center px-5 py-10">
      <div className="naik">
        <div className="eyebrow">Pencatat keuangan</div>

        <h1 className="display mt-3 text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em]">
          {judul}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {keterangan}
        </p>

        <div className="kartu mt-6 rounded-[20px] px-5 py-6">{children}</div>
      </div>
    </main>
  );
}

export function AuthField({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  const [lihat, setLihat] = useState(false);
  const password = type === "password";
  const tipeAktif = password && lihat ? "text" : type;

  return (
    <label className="block">
      <span
        className="mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: "var(--faint)" }}
      >
        {label}
      </span>

      <div className="relative mt-2">
        <input
          type={tipeAktif}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className="w-full rounded-[12px] px-[14px] py-3 text-[14px] outline-none transition-colors"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            color: "var(--text)",
            paddingRight: password ? 62 : undefined,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        />

        {password && (
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            className="mono absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider"
            style={{ color: "var(--faint)" }}
          >
            {lihat ? "Tutup" : "Lihat"}
          </button>
        )}
      </div>
    </label>
  );
}

export function AuthButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mono w-full rounded-[12px] py-3 text-[12px] font-semibold tracking-[0.06em] transition-opacity disabled:opacity-55"
      style={{ background: "var(--blue)", color: "var(--ink)" }}
    >
      {loading ? "Memproses..." : children}
    </button>
  );
}

export function AuthError({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <p
      className="rounded-[12px] px-[14px] py-3 text-[12.5px] leading-relaxed"
      style={{
        background: "rgba(255,120,71,.10)",
        border: "1px solid rgba(255,120,71,.28)",
        color: "var(--orange-deep)",
      }}
    >
      {pesan}
    </p>
  );
}
