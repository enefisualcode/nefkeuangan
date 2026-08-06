"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, AuthField, AuthButton, AuthError } from "../auth-ui";

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

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell judul="Masuk" keterangan="Lanjutkan mencatat pengeluaran harianmu.">
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
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />

        <AuthError pesan={error} />

        <AuthButton loading={loading}>Masuk</AuthButton>
      </form>

      <p className="mt-5 text-center text-[12.5px]" style={{ color: "var(--muted)" }}>
        Belum punya akun?{" "}
        <Link href="/register" className="mono" style={{ color: "var(--blue)" }}>
          Daftar
        </Link>
      </p>
    </AuthShell>
  );
}
