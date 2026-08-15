"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" | "reset" }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  return <form className="auth-card" onSubmit={async (event) => {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const endpoint = mode === "login" ? "/api/account/login" : mode === "register" ? "/api/account/register" : "/api/account/password";
    const body = mode === "forgot" ? { ...data, action: "request" } : mode === "reset" ? { ...data, action: "update" } : data;
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = (await response.json()) as { authenticated?: boolean; confirmationRequired?: boolean; error?: string };
    setPending(false);
    if (!response.ok) { setError(payload.error ?? "Request failed."); return; }
    if (mode === "forgot" || mode === "reset" || (mode === "register" && payload.confirmationRequired)) setSent(true);
    else { router.push("/account"); router.refresh(); }
  }}>
    <span className="eyebrow">Secure account</span>
    <h2>{mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : mode === "reset" ? "Choose a new password" : "Reset your password"}</h2>
    {mode === "register" ? <div className="form-grid two"><label className="field"><span className="field-label">First name</span><input required className="input" name="firstName" autoComplete="given-name" /></label><label className="field"><span className="field-label">Last name</span><input required className="input" name="lastName" autoComplete="family-name" /></label></div> : null}
    {mode !== "reset" ? <label className="field"><span className="field-label">Email</span><input required className="input" type="email" name="email" autoComplete="email" /></label> : null}
    {mode === "login" || mode === "register" || mode === "reset" ? <label className="field"><span className="field-label">Password</span><input required minLength={mode === "login" ? 8 : 10} className="input" type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} disabled={sent} /></label> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {sent ? <p className="form-success">{mode === "reset" ? "Your password has been updated. You can now sign in." : mode === "register" ? "Check your email to confirm your account, then sign in. If you already registered, sign in with your existing password." : "If the account exists, password instructions are on the way."}</p> : null}
    {!sent ? <button className="button button-primary" disabled={pending}>{pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Register" : mode === "reset" ? "Update password" : "Send instructions"}</button> : null}
    {mode === "login" ? <><Link className="text-link" href="/account/forgot-password">Forgot password?</Link><p>New here? <Link href="/account/register">Create an account</Link>.</p></> : mode === "register" ? <p>Already registered? <Link href="/account/login">Sign in</Link>.</p> : <Link className="text-link" href="/account/login">Back to login</Link>}
  </form>;
}
