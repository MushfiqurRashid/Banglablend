"use client";

import { useEffect, useState } from "react";
import Link from "@/components/navigation/smart-link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(!document.cookie.split("; ").some((value) => value.startsWith("bb_cookie_choice="))); }, []);
  if (!visible) return null;
  const choose = (value: "essential" | "analytics") => { document.cookie = `bb_cookie_choice=${value}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`; setVisible(false); };
  return <aside className="cookie-banner" aria-label="Cookie choices"><div><strong>Cookies, kept clear</strong><p>Essential cookies keep your market, secure cart and session working. Optional analytics stays off unless you allow it. <Link href="/legal/cookie-policy">Cookie policy</Link></p></div><div><button className="button button-secondary" onClick={() => choose("essential")}>Essential only</button><button className="button button-primary" onClick={() => choose("analytics")}>Allow analytics</button></div></aside>;
}
