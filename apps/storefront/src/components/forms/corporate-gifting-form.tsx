"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inquirySchema, type InquiryFormInput, type InquiryInput } from "@bangla-blend/validation";

export function CorporateGiftingForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InquiryFormInput, unknown, InquiryInput>({ resolver: zodResolver(inquirySchema), defaultValues: { type: "corporate" } });
  return <form className="checkout-card form-grid" onSubmit={handleSubmit(async (input) => { setServerError(undefined); const response = await fetch("/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); if (response.ok) { setSent(true); reset(); } else setServerError("We could not send the inquiry. Please try again."); })} noValidate><input type="hidden" {...register("type")} /><div className="form-grid two"><Field label="Company"><input className="input" {...register("company")} /></Field><Field label="Contact person" error={errors.contactPerson?.message}><input className="input" {...register("contactPerson")} /></Field><Field label="Email" error={errors.email?.message}><input className="input" type="email" {...register("email")} /></Field><Field label="Telephone"><input className="input" type="tel" {...register("telephone")} /></Field><Field label="Quantity"><input className="input" type="number" min="1" {...register("quantity")} /></Field><Field label="Budget"><input className="input" {...register("budget")} /></Field><Field label="Occasion"><input className="input" {...register("occasion")} /></Field><Field label="Delivery date"><input className="input" type="date" {...register("deliveryDate")} /></Field><Field label="Delivery locations" wide><textarea className="textarea" {...register("deliveryLocations")} /></Field><Field label="Packaging preferences" wide><input className="input" {...register("packaging")} /></Field><Field label="Message card" wide><textarea className="textarea" {...register("messageCard")} /></Field><Field label="Notes" error={errors.notes?.message} wide><textarea className="textarea" {...register("notes")} /></Field></div>{sent ? <p className="form-success" role="status">Thank you. Your inquiry has been received.</p> : null}{serverError ? <p className="form-error" role="alert">{serverError}</p> : null}<button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send inquiry"}</button></form>;
}

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) { return <label className={`field${wide ? " wide" : ""}`}><span className="field-label">{label}</span>{children}{error ? <span className="field-error">{error}</span> : null}</label>; }
