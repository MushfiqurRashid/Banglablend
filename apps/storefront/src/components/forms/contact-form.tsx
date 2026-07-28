"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { contactSchema, type ContactInput } from "@bangla-blend/validation";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  return (
    <form
      className="contact-form"
      aria-label="Send us a message"
      onSubmit={handleSubmit(async (input) => {
        setSent(false);
        setServerError(undefined);
        const response = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "contact", ...input }),
        });
        if (response.ok) {
          setSent(true);
          reset();
        } else {
          setServerError("We could not send your message. Please try again.");
        }
      })}
      noValidate
    >
      <div className="contact-form-fields">
        <Field label="Full name" error={errors.name?.message}>
          <input
            className="contact-input"
            placeholder="Full Name *"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </Field>
        <Field label="Email address" error={errors.email?.message}>
          <input
            className="contact-input"
            placeholder="Email Address *"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>
        <Field label="Phone number" wide>
          <input
            className="contact-input"
            placeholder="Phone Number"
            type="tel"
            autoComplete="tel"
            {...register("telephone")}
          />
        </Field>
        <Field label="Subject" error={errors.subject?.message} wide>
          <input
            className="contact-input"
            placeholder="Subject *"
            aria-invalid={Boolean(errors.subject)}
            {...register("subject")}
          />
        </Field>
        <Field label="Message" error={errors.message?.message} wide>
          <textarea
            className="contact-textarea"
            placeholder="Message *"
            aria-invalid={Boolean(errors.message)}
            {...register("message")}
          />
        </Field>
        <label className="sr-only">
          Leave this field empty
          <input tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>
      {sent ? (
        <p className="form-success" role="status">
          Thank you. Your message has been received.
        </p>
      ) : null}
      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}
      <button className="contact-submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
        {!isSubmitting ? <ArrowRight size={15} aria-hidden="true" /> : null}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`contact-form-field${wide ? "contact-field-wide" : ""}`}>
      <span className="sr-only">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
