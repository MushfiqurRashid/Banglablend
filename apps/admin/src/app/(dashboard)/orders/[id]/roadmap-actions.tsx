"use client";

import { useState, useTransition } from "react";
import { deliverOrderAction, fulfillOrderAction, shipOrderAction } from "../actions";
import type { OrderWorkflowView } from "@/lib/order-workflow";

export function RoadmapActions({ orderId, displayId, view }: { orderId: string; displayId: number; view: OrderWorkflowView }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!view.nextAction) return null;

  const run = () => {
    if (!confirm(view.nextAction!.confirmation)) return;
    startTransition(async () => {
      setError(null);
      try {
        if (view.nextAction!.type === "fulfill") await fulfillOrderAction(orderId, displayId);
        if (view.nextAction!.type === "ship") await shipOrderAction(orderId, view.nextAction!.fulfillmentId!, displayId);
        if (view.nextAction!.type === "deliver") await deliverOrderAction(orderId, view.nextAction!.fulfillmentId!, displayId);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "The order could not be updated.");
      }
    });
  };

  return (
    <div style={{ borderTop: "1px solid var(--color-border)", marginTop: "1.25rem", paddingTop: "1rem" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 0.65rem", textTransform: "uppercase" }}>
        Manual next action
      </p>
      <button className="btn btn-primary" onClick={run} disabled={pending}>
        {pending ? "Working..." : view.nextAction.label}
      </button>
      <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", margin: "0.65rem 0 0" }}>
        Payment/COD approval comes from the payment record. Packing, shipping, and delivery unlock one at a time so a step cannot be skipped.
      </p>
      {error ? (
        <p className="error-text" role="alert" style={{ marginTop: "0.6rem" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
