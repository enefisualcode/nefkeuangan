"use client";

import { useState } from "react";

export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Gagal mengganti password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setDone(true);
    setOpen(false);
  }

  if (!open) {
    return (
      <section className="rounded-xl bg-neutral-900 p-4">
        {done && (
          <p className="mb-2 text-sm text-emerald-400">
            ✅ Password berhasil diganti.
          </p>
        )}
        <button
          onClick={() => {
            setOpen(true);
            setDone(false);
          }}
          className="w-full rounded-lg bg-neutral-800 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
        >
          Ganti Password
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-neutral-900 p-4">
      <p className="text-sm font-medium text-neutral-300">Ganti Password</p>

      <input
        type="password"
        placeholder="Password sekarang"
        required
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <input
        type="password"
        placeholder="Password baru (min. 8 karakter)"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
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
