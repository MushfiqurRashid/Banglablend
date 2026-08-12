"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { setPasswordAction } from "./actions";

export default function SetPasswordPage() {
  const [state, formAction, pending] = useActionState(setPasswordAction, undefined);
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <ShieldCheck aria-hidden="true" className="auth-icon" />
        <h1>Set your password</h1>
        <p>Choose a unique password for your Bangla Blend staff account.</p>
        <form action={formAction} className="form-grid">
          <div className="field">
            <label className="label" htmlFor="password">New password</label>
            <input className="input" id="password" name="password" type="password" minLength={12} autoComplete="new-password" required autoFocus />
          </div>
          <div className="field">
            <label className="label" htmlFor="confirmation">Confirm password</label>
            <input className="input" id="confirmation" name="confirmation" type="password" minLength={12} autoComplete="new-password" required />
          </div>
          {state?.error ? <p className="error-text" role="alert">{state.error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Saving..." : "Set password"}</button>
        </form>
      </div>
    </main>
  );
}
