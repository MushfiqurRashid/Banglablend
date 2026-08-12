"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-shell">
      <section className="login-brand-panel" aria-label="Bangla Blend operations">
        <div className="login-brand-lockup">
          <img src="/images/bangla-blend-icon.png" alt="" />
          <div>
            <strong>Bangla Blend</strong>
            <span>Commerce operations</span>
          </div>
        </div>
        <div className="login-brand-copy">
          <h1>One clear view of the business.</h1>
          <p>Manage orders, catalog readiness, customers, content, and operational controls from a secure workspace.</p>
        </div>
        <div className="login-brand-footer">Authorized staff access only</div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <LockKeyhole aria-hidden="true" style={{ width: 24, height: 24, color: "var(--color-primary)", marginBottom: "1rem" }} />
          <h2>Welcome back</h2>
          <p>Sign in with your Bangla Blend staff account.</p>
          <form action={formAction}>
          <div className="field">
            <label className="label" htmlFor="email">
              Work email
            </label>
            <input className="input" id="email" name="email" type="email" required autoComplete="username" autoFocus />
          </div>
          <div className="field password-field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input className="input" id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" />
            <button
              className="password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          <Link href="/forgot-password" className="forgot-password-link">Forgot password?</Link>
          {state?.error ? (
            <p className="error-text" role="alert">
              {state.error}
            </p>
          ) : null}
          <button className="btn btn-primary login-submit" type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        </div>
      </section>
    </main>
  );
}
