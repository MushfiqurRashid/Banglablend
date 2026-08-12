"use client";

import { useActionState, useState } from "react";
import { saveAnnouncementTextAction } from "./actions";

export function AnnouncementTextForm({ initialText, readOnly }: { initialText: string; readOnly: boolean }) {
  const [state, formAction, pending] = useActionState(saveAnnouncementTextAction, undefined);
  const [preview, setPreview] = useState(initialText);

  return (
    <form action={formAction} className="card form-grid" style={{ maxWidth: 760 }}>
      <div className="field">
        <label className="label" htmlFor="message">Announcement text</label>
        <input
          className="input"
          id="message"
          name="message"
          required
          maxLength={180}
          value={preview}
          onChange={(event) => setPreview(event.target.value)}
          disabled={readOnly}
        />
        <span style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
          This sentence appears in the green bar at the very top of the storefront.
        </span>
      </div>

      <div style={{ borderRadius: "0.7rem", padding: "0.85rem 1rem", color: "white", background: "#214c2d", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.09em", textAlign: "center", textTransform: "uppercase" }}>
        {preview || "Your announcement text will appear here"}
      </div>

      {state?.error ? <p className="error-text" role="alert">{state.error}</p> : null}
      {state?.success ? <div className="notice" role="status">{state.success}</div> : null}
      {state?.warning ? <div className="notice" role="status">{state.warning}</div> : null}
      {!readOnly ? (
        <div><button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Saving..." : "Save announcement text"}</button></div>
      ) : (
        <div className="notice">Your role has read-only access to this content.</div>
      )}
    </form>
  );
}
