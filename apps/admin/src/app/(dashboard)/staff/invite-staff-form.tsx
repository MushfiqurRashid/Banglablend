"use client";

import { useActionState } from "react";
import { inviteStaffAction } from "./actions";

export function InviteStaffForm({ roles }: { roles: Array<{ id: string; name: string }> }) {
  const [state, formAction, pending] = useActionState(inviteStaffAction, undefined);
  return (
    <form action={formAction} className="card form-grid" style={{ maxWidth: 420 }}>
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Invite staff</h2>
        <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", margin: 0 }}>They will receive a secure email to activate their account.</p>
      </div>
      <div className="field">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input className="input" id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label className="label" htmlFor="fullName">
          Full name
        </label>
        <input className="input" id="fullName" name="fullName" />
      </div>
      <div className="field">
        <label className="label" htmlFor="roleId">
          Role
        </label>
        <select className="select" id="roleId" name="roleId" required>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>
      {state?.error ? <p className="error-text" role="alert">{state.error}</p> : null}
      {state?.success ? <p style={{ color: "var(--color-success)", fontSize: "0.8rem" }} role="status">{state.success}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: "start" }}>
        {pending ? "Inviting..." : "Invite"}
      </button>
    </form>
  );
}
