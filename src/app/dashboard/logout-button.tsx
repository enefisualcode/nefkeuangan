"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700"
    >
      Keluar
    </button>
  );
}
