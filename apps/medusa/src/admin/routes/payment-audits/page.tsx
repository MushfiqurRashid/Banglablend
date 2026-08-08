import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui";

interface PaymentAudit {
  id: string;
  provider: string;
  transaction_id: string;
  order_reference?: string | null;
  event_type: string;
  status: string;
  amount?: number | string | null;
  currency?: string | null;
  processed_at?: string | null;
}

const PaymentAuditsPage = () => {
  const [audits, setAudits] = useState<PaymentAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/admin/payment-audits", { credentials: "include" });
    const payload = await response.json().catch(() => null) as { payment_audits?: PaymentAudit[]; message?: string } | null;
    if (!response.ok) setError(payload?.message ?? "Payment audits could not be loaded.");
    else { setAudits(payload?.payment_audits ?? []); setError(undefined); }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="flex flex-col gap-y-4"><Container><div className="flex items-center justify-between"><div><Heading level="h1">Payment audit</Heading><Text className="mt-2 text-ui-fg-subtle">Safe SSLCOMMERZ validation and replay records. Reconcile these with provider settlement and order state.</Text></div><Button variant="secondary" onClick={() => void load()}>Refresh</Button></div></Container>{error ? <Container><Text className="text-ui-fg-error">{error}</Text></Container> : null}{loading ? <Container><Text>Loading payment records…</Text></Container> : audits.length ? audits.map((audit) => <Container key={audit.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Badge color={audit.status === "forwarded" ? "green" : audit.status === "rejected" || audit.status === "forward_failed" ? "red" : "orange"}>{audit.status}</Badge><Badge color="grey">{audit.provider}</Badge></div><Heading level="h2" className="mt-3">{audit.order_reference || audit.transaction_id}</Heading><Text className="mt-1 text-ui-fg-subtle">Transaction {audit.transaction_id}</Text></div><div className="text-right"><Text weight="plus">{audit.amount != null && audit.currency ? `${audit.amount} ${audit.currency.toUpperCase()}` : "Amount unavailable"}</Text>{audit.processed_at ? <Text className="text-ui-fg-subtle">{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(audit.processed_at))}</Text> : null}</div></div></Container>) : <Container><Text>No payment callbacks have been audited.</Text></Container>}</div>;
};

export default PaymentAuditsPage;
