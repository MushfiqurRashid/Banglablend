"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { forgotPasswordAction } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, undefined);
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <KeyRound aria-hidden="true" className="auth-icon" />
        <h1>Reset your password</h1>
        <p>Enter your staff email to receive a secure reset link.</p>
        <form action={formAction} className="form-grid">
          <div className="field">
            <label className="label" htmlFor="email">Work email</label>
            <input className="input" id="email" name="email" type="email" autoComplete="email" required autoFocus />
          </div>
          {state?.error ? <p className="error-text" role="alert">{state.error}</p> : null}
          {state?.success ? <p className="notice" role="status">{state.success}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</button>
        </form>
        <Link href="/login" className="auth-back"><ArrowLeft aria-hidden="true" /> Back to sign in</Link>
      </div>
    </main>
  );
}
