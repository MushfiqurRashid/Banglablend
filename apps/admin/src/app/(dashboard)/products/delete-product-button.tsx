"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { archiveProductFromListAction } from "./actions";

export function DeleteProductButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [done, formAction, pending] = useActionState(async () => {
    await archiveProductFromListAction(id, title);
    return true;
  }, false);

  useEffect(() => {
    if (done) router.refresh();
  }, [done, router]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Archive "${title}"? It will be removed from the storefront but retained in business history.`)) {
          e.preventDefault();
        }
      }}
    >
      <button className="btn btn-danger" type="submit" disabled={pending} style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}>
        {pending ? "Archiving..." : "Archive"}
      </button>
    </form>
  );
}
