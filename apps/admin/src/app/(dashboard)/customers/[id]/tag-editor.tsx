"use client";

import { useActionState } from "react";
import { updateCustomerTagsAction, type CustomerActionState } from "../actions";

export function CustomerTagEditor({ customerId, initialTags }: { customerId: string; initialTags: string[] }) {
  const boundAction = updateCustomerTagsAction.bind(null, customerId);
  const [state, formAction, pending] = useActionState<CustomerActionState | undefined, FormData>(boundAction, undefined);

  return (
    <form action={formAction} className="card form-grid">
      <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Tags</h2>
      <div className="field">
        <label className="label" htmlFor="tags">
          Tags (comma separated)
        </label>
        <input className="input" id="tags" name="tags" defaultValue={initialTags.join(", ")} placeholder="VIP, Wholesale, Repeat buyer" />
      </div>
      {state?.error ? <p className="error-text">{state.error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: "start" }}>
        {pending ? "Saving..." : "Save tags"}
      </button>
    </form>
  );
}
