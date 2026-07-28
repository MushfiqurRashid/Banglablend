"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterSchema } from "@bangla-blend/validation";
import type { z } from "zod";

type Input = z.infer<typeof newsletterSchema>;

export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Input>({ resolver: zodResolver(newsletterSchema) });
  return (
    <form className="newsletter-form" onSubmit={handleSubmit(async (input) => {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "newsletter", ...input }) });
      setStatus(response.ok ? "success" : "error");
      if (response.ok) reset();
    })} noValidate>
      <div style={{ flex: 1 }}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Your email address" autoComplete="email" {...register("email")} aria-invalid={Boolean(errors.email)} />{errors.email ? <span className="field-error">{errors.email.message}</span> : null}{status === "success" ? <span className="form-success">You’re on the list.</span> : null}{status === "error" ? <span className="field-error">Please try again.</span> : null}</div>
      <button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? "Joining…" : "Join the list"}</button>
    </form>
  );
}
