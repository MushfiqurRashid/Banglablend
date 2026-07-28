"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return <button className="text-link" onClick={async () => { await fetch("/api/account/logout", { method: "POST" }); router.push("/"); router.refresh(); }}>Sign out</button>;
}
