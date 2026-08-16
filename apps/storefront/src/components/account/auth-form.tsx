"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="google-mark" viewBox="0 0 24 24">
      <path
        fill="#4285f4"
        d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.7h3.5c2-1.9 3.2-4.6 3.2-7.7Z"
      />
      <path
        fill="#34a853"
        d="M12 22c2.9 0 5.3-1 7-2.6l-3.5-2.7c-1 .7-2.2 1-3.5 1a6.1 6.1 0 0 1-5.8-4.2H2.6v2.8A10.5 10.5 0 0 0 12 22Z"
      />
      <path
        fill="#fbbc05"
        d="M6.2 13.5a6.2 6.2 0 0 1 0-3.9V6.8H2.6a10.5 10.5 0 0 0 0 9.5l3.6-2.8Z"
      />
      <path
        fill="#ea4335"
        d="M12 5.3c1.6 0 3 .5 4.1 1.6l3-3A10 10 0 0 0 2.6 6.8l3.6 2.8A6.1 6.1 0 0 1 12 5.3Z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  initialError,
}: {
  mode: "login" | "register" | "forgot" | "reset";
  initialError?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>(initialError);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const supportsGoogle = mode === "login" || mode === "register";

  return (
    <form
      className="auth-card"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(undefined);
        try {
          const data = Object.fromEntries(new FormData(event.currentTarget));
          const endpoint =
            mode === "login"
              ? "/api/account/login"
              : mode === "register"
                ? "/api/account/register"
                : "/api/account/password";
          const body =
            mode === "forgot"
              ? { ...data, action: "request" }
              : mode === "reset"
                ? { ...data, action: "update" }
                : data;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          const payload = (await response.json().catch(() => ({}))) as {
            authenticated?: boolean;
            confirmationRequired?: boolean;
            error?: string;
          };
          if (!response.ok) {
            setError(payload.error ?? "We could not complete that request. Please try again.");
            return;
          }
          if (
            mode === "forgot" ||
            mode === "reset" ||
            (mode === "register" && payload.confirmationRequired)
          )
            setSent(true);
          else {
            router.push("/account");
            router.refresh();
          }
        } catch {
          setError("We could not connect. Check your connection and try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <span className="eyebrow">Secure account</span>
      <h2>
        {mode === "login"
          ? "Welcome back"
          : mode === "register"
            ? "Create your account"
            : mode === "reset"
              ? "Choose a new password"
              : "Reset your password"}
      </h2>
      {supportsGoogle ? (
        <>
          <a
            aria-disabled={googlePending}
            className="button google-auth-button"
            href="/auth/google"
            onClick={(event) => {
              if (googlePending) event.preventDefault();
              else setGooglePending(true);
            }}
          >
            <GoogleMark />
            {googlePending ? "Connecting to Google…" : "Continue with Google"}
          </a>
          <div className="auth-divider" role="separator">
            <span>or continue with email</span>
          </div>
        </>
      ) : null}
      {mode === "register" ? (
        <div className="form-grid two">
          <label className="field">
            <span className="field-label">First name</span>
            <input required className="input" name="firstName" autoComplete="given-name" />
          </label>
          <label className="field">
            <span className="field-label">Last name</span>
            <input required className="input" name="lastName" autoComplete="family-name" />
          </label>
        </div>
      ) : null}
      {mode !== "reset" ? (
        <label className="field">
          <span className="field-label">Email</span>
          <input required className="input" type="email" name="email" autoComplete="email" />
        </label>
      ) : null}
      {mode === "login" || mode === "register" || mode === "reset" ? (
        <label className="field">
          <span className="field-label">Password</span>
          <input
            required
            minLength={mode === "login" ? 8 : 10}
            className="input"
            type="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={sent}
          />
        </label>
      ) : null}
      {mode === "register" ? (
        <p className="field-note">Use at least 10 characters for your password.</p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p className="form-success" role="status">
          {mode === "reset"
            ? "Your password has been updated. You can now sign in."
            : mode === "register"
              ? "Check your email for a confirmation link. If the address is already registered, sign in instead."
              : "If the account exists, password instructions are on the way."}
        </p>
      ) : null}
      {!sent ? (
        <button className="button button-primary" type="submit" disabled={pending || googlePending}>
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "register"
                ? "Create account"
                : mode === "reset"
                  ? "Update password"
                  : "Send instructions"}
        </button>
      ) : null}
      {mode === "login" ? (
        <>
          <Link className="text-link" href="/account/forgot-password">
            Forgot password?
          </Link>
          <p>
            New here? <Link href="/account/register">Create an account</Link>.
          </p>
        </>
      ) : mode === "register" ? (
        <p>
          Already registered? <Link href="/account/login">Sign in</Link>.
        </p>
      ) : (
        <Link className="text-link" href="/account/login">
          Back to login
        </Link>
      )}
    </form>
  );
}
