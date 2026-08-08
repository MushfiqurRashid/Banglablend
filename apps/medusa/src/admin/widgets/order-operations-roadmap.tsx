import { useEffect, useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";
import { Badge, Button, Container, Heading, Switch, Text } from "@medusajs/ui";

type WorkflowAction = "fulfill" | "ship" | "deliver";
type RoadmapState = "complete" | "current" | "pending" | "exception";

interface WorkflowPayload {
  workflow: {
    id: string;
    reference: string;
    status: string;
    payment_status: string;
    fulfillment_status: string;
    payment_method: "cod" | "online";
    steps: Array<{
      key: string;
      label: string;
      description: string;
      state: RoadmapState;
      at?: string;
    }>;
    next_action: {
      type: WorkflowAction;
      label: string;
      confirmation: string;
      fulfillment_id?: string;
    } | null;
    exception: { label: string; description: string } | null;
  };
}

const stateLabel: Record<RoadmapState, string> = {
  complete: "Complete",
  current: "Current",
  pending: "Waiting",
  exception: "Exception",
};

const stateColor: Record<RoadmapState, "green" | "blue" | "grey" | "red"> = {
  complete: "green",
  current: "blue",
  pending: "grey",
  exception: "red",
};

const dateFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function readPayload(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | (Partial<WorkflowPayload> & { message?: string })
    | null;
  if (!response.ok || !payload?.workflow) {
    throw new Error(payload?.message ?? "The order workflow could not be updated.");
  }
  return payload as WorkflowPayload;
}

const OrderOperationsRoadmap = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [workflow, setWorkflow] = useState<WorkflowPayload["workflow"]>();
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/admin/superadmin/orders/${encodeURIComponent(order.id)}/workflow`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(readPayload)
      .then((payload) => {
        setWorkflow(payload.workflow);
        setError(undefined);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "The order workflow is unavailable.");
      });
    return () => controller.abort();
  }, [order.id]);

  const runNextAction = async () => {
    const action = workflow?.next_action;
    if (!action || saving || !window.confirm(action.confirmation)) return;

    setSaving(true);
    setError(undefined);
    try {
      const response = await fetch(
        `/admin/superadmin/orders/${encodeURIComponent(order.id)}/workflow`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: action.type,
            notify_customer: notifyCustomer,
          }),
        },
      );
      const payload = await readPayload(response);
      setWorkflow(payload.workflow);
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The order workflow could not be updated.");
      setSaving(false);
    }
  };

  return (
    <Container>
      <div data-testid="order-roadmap" className="min-w-0">
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Heading level="h2">Order roadmap</Heading>
            {workflow ? (
              <Badge color="purple" className="whitespace-nowrap">
                {workflow.reference}
              </Badge>
            ) : null}
          </div>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Operational status backed by Medusa payment, fulfillment, shipment, delivery, return,
            and inventory records.
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted mt-1 break-all">
            Internal ID: {order.id}
          </Text>
        </div>
        {workflow ? (
          <div className="flex flex-wrap gap-2">
            <Badge
              color={workflow.payment_method === "cod" ? "orange" : "green"}
              className="whitespace-nowrap"
            >
              {workflow.payment_method === "cod" ? "Cash on Delivery" : "Online payment"}
            </Badge>
            <Badge color="grey" className="whitespace-nowrap">
              {workflow.fulfillment_status.replaceAll("_", " ")}
            </Badge>
          </div>
        ) : null}
      </div>

      {!workflow && !error ? (
        <Text className="text-ui-fg-subtle mt-5">Loading the order roadmap...</Text>
      ) : null}

      {workflow ? (
        <div className="mt-5 flex flex-col">
          {workflow.steps.map((step, index) => (
            <div key={step.key} className="flex min-w-0 gap-3">
              <div className="flex w-8 shrink-0 flex-col items-center">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                    step.state === "complete"
                      ? "border-ui-border-success bg-ui-bg-base"
                      : step.state === "current"
                        ? "border-ui-border-interactive bg-ui-bg-highlight"
                        : step.state === "exception"
                          ? "border-ui-border-error bg-ui-bg-base-error"
                          : "border-ui-border-base bg-ui-bg-subtle"
                  }`}
                >
                  <Text size="xsmall" weight="plus">
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </div>
                {index < workflow.steps.length - 1 ? (
                  <div className="bg-ui-border-base min-h-3 w-px flex-1" aria-hidden="true" />
                ) : null}
              </div>
              <div
                className={`mb-3 min-w-0 flex-1 rounded-lg border p-4 ${
                  step.state === "complete"
                    ? "border-ui-border-success bg-ui-bg-base"
                    : step.state === "current"
                      ? "border-ui-border-interactive bg-ui-bg-highlight"
                      : step.state === "exception"
                        ? "border-ui-border-error bg-ui-bg-base-error"
                        : "border-ui-border-base bg-ui-bg-subtle"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Text weight="plus">{step.label}</Text>
                  <Badge color={stateColor[step.state]} className="shrink-0 whitespace-nowrap">
                    {stateLabel[step.state]}
                  </Badge>
                </div>
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  {step.description}
                </Text>
                {step.at ? (
                  <Text size="xsmall" className="text-ui-fg-muted mt-2">
                    {dateFormatter.format(new Date(step.at))}
                  </Text>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {workflow?.exception ? (
        <div className="bg-ui-bg-base-error mt-4 rounded-lg p-4" role="alert">
          <Text weight="plus" className="text-ui-fg-error">
            {workflow.exception.label}
          </Text>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {workflow.exception.description}
          </Text>
        </div>
      ) : null}

      {error ? (
        <div className="bg-ui-bg-base-error mt-4 rounded-lg p-4" role="alert">
          <Text className="text-ui-fg-error">{error}</Text>
        </div>
      ) : null}

      {workflow?.next_action ? (
        <div className="border-ui-border-base mt-4 flex flex-col gap-4 rounded-lg border p-4">
          <div>
            <Text weight="plus">Next operational action</Text>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              {workflow.next_action.label}. Later stages remain locked until this action succeeds.
            </Text>
            <label className="mt-3 flex items-center gap-2">
              <Switch checked={notifyCustomer} onCheckedChange={setNotifyCustomer} />
              <Text size="small">Send configured customer notification</Text>
            </label>
          </div>
          <Button
            className="self-start"
            onClick={() => void runNextAction()}
            disabled={saving}
          >
            {saving ? "Updating..." : workflow.next_action.label}
          </Button>
        </div>
      ) : workflow && !workflow.exception ? (
        <div className="bg-ui-bg-subtle mt-4 rounded-lg p-4">
          <Text weight="plus">No fulfillment action is pending</Text>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Delivered orders remain available for supported return, exchange, refund, and completion
            workflows in Medusa.
          </Text>
        </div>
      ) : null}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.before",
  id: "bangla-blend:order-operations-roadmap",
});

export default OrderOperationsRoadmap;
