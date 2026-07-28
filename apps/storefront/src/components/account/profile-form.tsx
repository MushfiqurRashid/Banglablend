"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({ customer }: { customer: { email: string; firstName: string; lastName: string; phone: string } }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);
  const [phone, setPhone] = useState(customer.phone);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string }>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(undefined);
    const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ firstName, lastName, phone }) });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setStatus(response.ok ? { ok: true, message: "Profile updated." } : { ok: false, message: result?.error ?? "Your profile could not be updated." });
    if (response.ok) router.refresh();
    setPending(false);
  }

  return <form className="checkout-card form-grid profile-form" onSubmit={(event) => void submit(event)}>
    <div className="form-grid two">
      <label className="field"><span className="field-label">First name</span><input className="input" required maxLength={80} autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
      <label className="field"><span className="field-label">Last name</span><input className="input" required maxLength={80} autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
      <label className="field"><span className="field-label">Email</span><input className="input" type="email" value={customer.email} readOnly aria-describedby="email-note" /></label>
      <label className="field"><span className="field-label">Telephone</span><input className="input" type="tel" minLength={6} maxLength={30} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
    </div>
    <p id="email-note" className="field-note">Contact support to change the email used to sign in.</p>
    {status ? <p className={status.ok ? "form-success" : "form-error"} role="status">{status.message}</p> : null}
    <button className="button button-primary" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
  </form>;
}
