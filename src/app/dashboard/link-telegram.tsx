"use client";

import { useState } from "react";

export function LinkTelegram({
  telegramUsername,
}: {
  telegramUsername: string | null;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (telegramUsername) {
    return (
      <section className="rounded-xl bg-neutral-900 p-4">
        <p className="text-sm text-neutral-300">
          🤖 Telegram terhubung: <span className="text-emerald-400">@{telegramUsername}</span>
        </p>
      </section>
    );
  }

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/link/generate", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setCode(data.code);
  }

  return (
    <section className="rounded-xl bg-neutral-900 p-4">
      <p className="mb-2 text-sm font-medium text-neutral-300">Hubungkan Bot Telegram</p>
      {code ? (
        <div className="space-y-2">
          <p className="text-xs text-neutral-400">
            Buka bot Telegram kamu, lalu kirim pesan ini (berlaku 10 menit):
          </p>
          <p className="rounded-lg bg-neutral-800 px-3 py-2 text-center font-mono text-lg text-emerald-400">
            /link {code}
          </p>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full rounded-lg bg-neutral-800 py-2 text-sm text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Membuat kode..." : "Buat Kode Penghubung"}
        </button>
      )}
    </section>
  );
}
