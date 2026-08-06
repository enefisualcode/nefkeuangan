"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, AuthField, AuthButton, AuthError } from "../auth-ui";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Gagal mendaftar.");
      return;
    }

    const masuk = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (masuk?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      judul="Buat akun"
      keterangan="Catat lewat web atau bot Telegram — datanya menyatu."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
          placeholder="nama@email.com"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Minimal 8 karakter"
        />

        <AuthError pesan={error} />

        <AuthButton loading={loading}>Daftar</AuthButton>
      </form>

      <p className="mt-5 text-center text-[12.5px]" style={{ color: "var(--muted)" }}>
        Sudah punya akun?{" "}
        <Link href="/login" className="mono" style={{ color: "var(--blue)" }}>
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
