import { Check } from "lucide-react";
import type { TrackingStep } from "@/lib/order-tracking";

export function OrderTrackingTimeline({ steps }: { steps: TrackingStep[] }) {
  return (
    <ol className="order-tracking-timeline">
      {steps.map((step) => (
        <li key={step.key} className={`order-tracking-step is-${step.state}`}>
          <span className="order-tracking-dot" aria-hidden="true">
            {step.state === "complete" ? <Check size={12} /> : null}
          </span>
          <span className="order-tracking-copy">
            <strong>{step.label}</strong>
            {step.at ? <time dateTime={step.at}>{new Date(step.at).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}</time> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
