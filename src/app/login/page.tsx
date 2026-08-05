"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-neutral-900 p-6 shadow-xl"
      >
        <h1 className="text-xl font-semibold text-white">Masuk</h1>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <p className="text-center text-sm text-neutral-400">
          Belum punya akun?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">
            Daftar
          </Link>
        </p>
      </form>
    </main>
  );
}
