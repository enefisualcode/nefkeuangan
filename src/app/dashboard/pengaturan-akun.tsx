"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { PilihTema } from "./pilih-tema";

export function PengaturanAkun({
  email,
  telegramId,
  telegramUsername,
}: {
  email: string;
  telegramId: string | null;
  telegramUsername: string | null;
}) {
  const [buka, setBuka] = useState(false);

  return (
    <section className="mx-5 mt-6">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="mono w-full text-left text-[10.5px] uppercase tracking-[0.16em]"
        style={{ color: "var(--faint)" }}
      >
        Pengaturan {buka ? "▴" : "▾"}
      </button>

      {buka && (
        <div className="mt-3 space-y-2.5">
          <div
            className="rounded-[14px] px-[15px] py-3.5 text-[12px]"
            style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--muted)" }}
          >
            Masuk sebagai <span style={{ color: "var(--text)" }}>{email}</span>
          </div>

          <PilihTema />
          <HubungkanTelegram telegramId={telegramId} telegramUsername={telegramUsername} />
          <GantiPassword />

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-[14px] py-2.5 text-[12px]"
            style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--muted)" }}
          >
            Keluar
          </button>
        </div>
      )}
    </section>
  );
}

const kotak = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
} as const;

const isian =
  "w-full rounded-[10px] px-3 py-2 text-[13px] outline-none focus:ring-1";

function HubungkanTelegram({
  telegramId,
  telegramUsername,
}: {
  telegramId: string | null;
  telegramUsername: string | null;
}) {
  const [kode, setKode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (telegramId && !kode) {
    return (
      <div className="rounded-[14px] px-[15px] py-3.5 text-[12px]" style={{ ...kotak, color: "var(--muted)" }}>
        🤖 Telegram terhubung
        {telegramUsername && <span style={{ color: "var(--blue)" }}> · @{telegramUsername}</span>}
      </div>
    );
  }

  async function buat() {
    setLoading(true);
    const res = await fetch("/api/link/generate", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setKode(data.code);
  }

  return (
    <div className="rounded-[14px] px-[15px] py-3.5" style={kotak}>
      <p className="mb-2 text-[12px]" style={{ color: "var(--muted)" }}>
        Hubungkan bot Telegram
      </p>
      {kode ? (
        <>
          <p className="mb-1.5 text-[11px]" style={{ color: "var(--faint)" }}>
            Kirim pesan ini ke bot (berlaku 10 menit):
          </p>
          <p
            className="mono rounded-[10px] py-2 text-center text-[15px]"
            style={{ background: "var(--surface-2)", color: "var(--blue)" }}
          >
            /link {kode}
          </p>
        </>
      ) : (
        <button
          onClick={buat}
          disabled={loading}
          className="mono w-full rounded-[10px] py-2 text-[11px] disabled:opacity-50"
          style={{ background: "var(--surface-2)", color: "var(--blue)" }}
        >
          {loading ? "Membuat kode..." : "Buat kode penghubung"}
        </button>
      )}
    </div>
  );
}

function GantiPassword() {
  const [buka, setBuka] = useState(false);
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [pesan, setPesan] = useState("");
  const [salah, setSalah] = useState(false);
  const [loading, setLoading] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setPesan("");
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: lama, newPassword: baru }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setSalah(true);
      setPesan(data.error ?? "Gagal mengganti password.");
      return;
    }
    setSalah(false);
    setPesan("Password berhasil diganti.");
    setLama("");
    setBaru("");
    setBuka(false);
  }

  if (!buka) {
    return (
      <div className="rounded-[14px] px-[15px] py-3.5" style={kotak}>
        {pesan && !salah && (
          <p className="mb-2 text-[12px]" style={{ color: "var(--blue)" }}>
            ✅ {pesan}
          </p>
        )}
        <button
          onClick={() => setBuka(true)}
          className="mono w-full rounded-[10px] py-2 text-[11px]"
          style={{ background: "var(--surface-2)", color: "var(--blue)" }}
        >
          Ganti password
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={kirim} className="space-y-2.5 rounded-[14px] px-[15px] py-3.5" style={kotak}>
      <p className="text-[12px]" style={{ color: "var(--muted)" }}>
        Ganti password
      </p>
      <input
        type="password"
        placeholder="Password sekarang"
        required
        value={lama}
        onChange={(e) => setLama(e.target.value)}
        className={isian}
        style={{ background: "var(--surface-2)", color: "var(--text)" }}
      />
      <input
        type="password"
        placeholder="Password baru (min. 8 karakter)"
        required
        minLength={8}
        value={baru}
        onChange={(e) => setBaru(e.target.value)}
        className={isian}
        style={{ background: "var(--surface-2)", color: "var(--text)" }}
      />
      {pesan && salah && (
        <p className="text-[12px]" style={{ color: "var(--orange-deep)" }}>
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
