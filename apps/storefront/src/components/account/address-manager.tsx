"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerAddress } from "@/lib/auth/server";

type EditableAddress = Omit<CustomerAddress, "id">;

const emptyAddress: EditableAddress = { country_code: "BD" };

function payload(address: EditableAddress) {
  return {
    firstName: address.first_name ?? "",
    lastName: address.last_name ?? "",
    address1: address.address_1 ?? "",
    address2: address.address_2 ?? "",
    city: address.city ?? "",
    province: address.province ?? "",
    postalCode: address.postal_code ?? "",
    countryCode: (address.country_code ?? "BD").toUpperCase(),
    phone: address.phone ?? "",
    isDefaultShipping: address.is_default_shipping ?? false,
    isDefaultBilling: address.is_default_billing ?? false
  };
}

export function AddressManager({ initialAddresses }: { initialAddresses: CustomerAddress[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<string | "new" | null>(initialAddresses.length ? null : "new");
  const [draft, setDraft] = useState<EditableAddress>(emptyAddress);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => setAddresses(initialAddresses), [initialAddresses]);

  function beginEdit(address?: CustomerAddress) {
    setEditing(address?.id ?? "new");
    setDraft(address ? { ...address } : emptyAddress);
    setMessage(undefined);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);
    const url = editing === "new" ? "/api/account/addresses" : `/api/account/addresses/${encodeURIComponent(editing ?? "")}`;
    const response = await fetch(url, {
      method: editing === "new" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload(draft))
    });
    const result = await response.json().catch(() => null) as { error?: string; customer?: { addresses?: CustomerAddress[] } } | null;
    if (!response.ok) setMessage(result?.error ?? "The address could not be saved.");
    else {
      setMessage("Address saved.");
      setEditing(null);
      router.refresh();
    }
    setPending(false);
  }

  async function remove(address: CustomerAddress) {
    if (!window.confirm("Remove this saved address?")) return;
    setPending(true);
    setMessage(undefined);
    const response = await fetch(`/api/account/addresses/${encodeURIComponent(address.id)}`, { method: "DELETE" });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) setMessage(result?.error ?? "The address could not be removed.");
    else {
      setAddresses((current) => current.filter((item) => item.id !== address.id));
      setMessage("Address removed.");
      router.refresh();
    }
    setPending(false);
  }

  const set = (field: keyof EditableAddress) => (event: React.ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const toggle = (field: "is_default_shipping" | "is_default_billing") => (event: React.ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, [field]: event.target.checked }));

  return <>
    <div className="account-action-row"><h2>Saved addresses</h2><button className="button button-secondary" type="button" onClick={() => beginEdit()}>Add address</button></div>
    {addresses.length ? <div className="account-dashboard">{addresses.map((address) => <address className="account-panel address-card" key={address.id}>
      <div><h3>{[address.first_name, address.last_name].filter(Boolean).join(" ") || "Saved address"}</h3>{address.is_default_shipping ? <span className="address-badge">Default shipping</span> : null}{address.is_default_billing ? <span className="address-badge">Default billing</span> : null}</div>
      <p>{[address.address_1, address.address_2, address.city, address.province, address.postal_code, address.country_code?.toUpperCase()].filter(Boolean).join(", ")}</p>{address.phone ? <p>{address.phone}</p> : null}
      <div className="address-actions"><button type="button" onClick={() => beginEdit(address)} disabled={pending}>Edit</button><button type="button" onClick={() => void remove(address)} disabled={pending}>Remove</button></div>
    </address>)}</div> : editing !== "new" ? <div className="empty-state"><h3>No saved addresses</h3><p>Add a delivery or billing address for quicker checkout.</p></div> : null}
    {editing ? <form className="checkout-card form-grid address-form" onSubmit={(event) => void save(event)}>
      <div><span className="eyebrow">{editing === "new" ? "New address" : "Edit address"}</span><h2>{editing === "new" ? "Add an address" : "Update this address"}</h2></div>
      <div className="form-grid two">
        <label className="field"><span className="field-label">First name</span><input className="input" required maxLength={80} autoComplete="given-name" value={draft.first_name ?? ""} onChange={set("first_name")} /></label>
        <label className="field"><span className="field-label">Last name</span><input className="input" required maxLength={80} autoComplete="family-name" value={draft.last_name ?? ""} onChange={set("last_name")} /></label>
        <label className="field wide"><span className="field-label">Address line 1</span><input className="input" required minLength={3} maxLength={160} autoComplete="address-line1" value={draft.address_1 ?? ""} onChange={set("address_1")} /></label>
        <label className="field wide"><span className="field-label">Address line 2</span><input className="input" maxLength={160} autoComplete="address-line2" value={draft.address_2 ?? ""} onChange={set("address_2")} /></label>
        <label className="field"><span className="field-label">City</span><input className="input" required minLength={2} maxLength={100} autoComplete="address-level2" value={draft.city ?? ""} onChange={set("city")} /></label>
        <label className="field"><span className="field-label">Province / district</span><input className="input" maxLength={100} autoComplete="address-level1" value={draft.province ?? ""} onChange={set("province")} /></label>
        <label className="field"><span className="field-label">Postal code</span><input className="input" maxLength={24} autoComplete="postal-code" value={draft.postal_code ?? ""} onChange={set("postal_code")} /></label>
        <label className="field"><span className="field-label">Country code</span><input className="input" required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" autoComplete="country" value={draft.country_code ?? ""} onChange={set("country_code")} /></label>
        <label className="field wide"><span className="field-label">Telephone</span><input className="input" required minLength={6} maxLength={30} type="tel" autoComplete="tel" value={draft.phone ?? ""} onChange={set("phone")} /></label>
        <label className="checkbox-row"><input type="checkbox" checked={draft.is_default_shipping ?? false} onChange={toggle("is_default_shipping")} /><span>Use as default shipping address</span></label>
        <label className="checkbox-row"><input type="checkbox" checked={draft.is_default_billing ?? false} onChange={toggle("is_default_billing")} /><span>Use as default billing address</span></label>
      </div>
      {message ? <p className={message.endsWith("saved.") ? "form-success" : "form-error"} role="status">{message}</p> : null}
      <div className="address-form-actions"><button className="button button-primary" disabled={pending}>{pending ? "Saving…" : "Save address"}</button><button className="button button-secondary" type="button" onClick={() => setEditing(null)} disabled={pending}>Cancel</button></div>
    </form> : message ? <p className="form-success" role="status">{message}</p> : null}
  </>;
}
