"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Storefront route error", error.digest ?? error.name); }, [error]);
  return <div className="shell section"><div className="empty-state"><h1>Something went off recipe</h1><p>The page could not be prepared. No payment or order state has been changed.</p><button className="button button-primary" onClick={reset}>Try again</button></div></div>;
}
