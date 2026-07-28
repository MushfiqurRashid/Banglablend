"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inquirySchema, type InquiryFormInput, type InquiryInput } from "@bangla-blend/validation";

export function WholesaleInquiryForm() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InquiryFormInput, unknown, InquiryInput>({ resolver: zodResolver(inquirySchema), defaultValues: { type: "wholesale" } });
  return <form className="checkout-card form-grid" onSubmit={handleSubmit(async (input) => { const response = await fetch("/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); if (response.ok) { setSent(true); reset(); } })}><input type="hidden" {...register("type")} /><div className="form-grid two"><label className="field"><span className="field-label">Company</span><input className="input" {...register("company")} /></label><label className="field"><span className="field-label">Contact person</span><input className="input" {...register("contactPerson")} />{errors.contactPerson ? <span className="field-error">{errors.contactPerson.message}</span> : null}</label><label className="field"><span className="field-label">Email</span><input className="input" type="email" {...register("email")} />{errors.email ? <span className="field-error">{errors.email.message}</span> : null}</label><label className="field"><span className="field-label">Telephone</span><input className="input" type="tel" {...register("telephone")} /></label><label className="field wide"><span className="field-label">Markets, products, quantities and timing</span><textarea className="textarea" {...register("notes")} />{errors.notes ? <span className="field-error">{errors.notes.message}</span> : null}</label></div>{sent ? <p className="form-success">Your wholesale inquiry has been received.</p> : null}<button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send wholesale inquiry"}</button></form>;
}
