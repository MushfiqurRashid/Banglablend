import { useCallback, useEffect, useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui";

type InquiryStatus = "new" | "acknowledged" | "in_progress" | "closed";
interface Inquiry {
  id: string;
  type: "contact" | "newsletter" | "wholesale" | "corporate";
  status: InquiryStatus;
  company?: string | null;
  contact_person?: string | null;
  email: string;
  telephone?: string | null;
  quantity?: number | null;
  notes?: string | null;
  created_at?: string;
}

const statusColors = { new: "blue", acknowledged: "grey", in_progress: "orange", closed: "green" } as const;

const InquiriesPage = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/admin/inquiries", { credentials: "include" });
    const payload = await response.json().catch(() => null) as { inquiries?: Inquiry[]; message?: string } | null;
    if (!response.ok) setError(payload?.message ?? "Inquiries could not be loaded.");
    else { setInquiries(payload?.inquiries ?? []); setError(undefined); }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function update(id: string, status: InquiryStatus) {
    const response = await fetch(`/admin/inquiries/${encodeURIComponent(id)}`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) setInquiries((current) => current.map((inquiry) => inquiry.id === id ? { ...inquiry, status } : inquiry));
    else setError("The inquiry status could not be updated.");
  }

  return <div className="flex flex-col gap-y-4"><Container><div className="flex items-center justify-between"><div><Heading level="h1">Customer inquiries</Heading><Text className="mt-2 text-ui-fg-subtle">Contact, newsletter, wholesale, and corporate gifting submissions.</Text></div><Button variant="secondary" onClick={() => void load()}>Refresh</Button></div></Container>{error ? <Container><Text className="text-ui-fg-error">{error}</Text></Container> : null}{loading ? <Container><Text>Loading inquiries…</Text></Container> : inquiries.length ? inquiries.map((inquiry) => <Container key={inquiry.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Badge color={statusColors[inquiry.status]}>{inquiry.status.replace("_", " ")}</Badge><Badge color="grey">{inquiry.type}</Badge></div><Heading level="h2" className="mt-3">{inquiry.company || inquiry.contact_person || inquiry.email}</Heading><Text className="mt-1 text-ui-fg-subtle">{inquiry.email}{inquiry.telephone ? ` · ${inquiry.telephone}` : ""}</Text>{inquiry.notes ? <Text className="mt-3 whitespace-pre-wrap">{inquiry.notes}</Text> : null}{inquiry.quantity ? <Text className="mt-2 text-ui-fg-subtle">Requested quantity: {inquiry.quantity}</Text> : null}</div><label className="flex flex-col gap-1 text-sm"><span>Status</span><select className="rounded-md border bg-ui-bg-field px-3 py-2" value={inquiry.status} onChange={(event) => void update(inquiry.id, event.target.value as InquiryStatus)}>{(["new", "acknowledged", "in_progress", "closed"] as const).map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select></label></div></Container>) : <Container><Text>No inquiries have been received.</Text></Container>}</div>;
};

export const config = defineRouteConfig({ label: "Inquiries", icon: Buildings });
export default InquiriesPage;
