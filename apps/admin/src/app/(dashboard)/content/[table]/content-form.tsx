"use client";

import type { ContentTypeDef } from "@/lib/content-registry";
import { portableTextToPlainText } from "@/lib/content-format";
import type { ContentActionState } from "./actions";

function toDisplayValue(kind: string, value: unknown) {
  if (value === null || value === undefined) return "";
  if (kind === "array" && Array.isArray(value)) return value.join(", ");
  if (kind === "richtext") return portableTextToPlainText(value);
  if (kind === "json") return JSON.stringify(value, null, 2);
  return String(value);
}

export function ContentForm({
  contentType,
  initial,
  foreignOptions,
  formAction,
  state,
  pending,
  submitLabel,
  readOnly = false,
}: {
  contentType: ContentTypeDef;
  initial: Record<string, unknown>;
  foreignOptions: Record<string, Array<{ id: string; label: string }>>;
  formAction: (formData: FormData) => void;
  state: ContentActionState | undefined;
  pending: boolean;
  submitLabel: string;
  readOnly?: boolean;
}) {
  return (
    <form action={formAction} className="card form-grid" style={{ maxWidth: 640 }}>
      <fieldset disabled={readOnly} style={{ display: "contents" }}>
      {contentType.fields.map((field) => {
        const value = initial[field.name];
        if (field.kind === "boolean") {
          return (
            <label key={field.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" name={field.name} defaultChecked={Boolean(value)} />
              {field.label}
            </label>
          );
        }
        if (field.kind === "select") {
          return (
            <div className="field" key={field.name}>
              <label className="label" htmlFor={field.name}>
                {field.label}
              </label>
              <select className="select" id={field.name} name={field.name} defaultValue={String(value ?? "")} required={field.required}>
                <option value="">—</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (field.kind === "foreignKey") {
          const options = foreignOptions[field.name] ?? [];
          return (
            <div className="field" key={field.name}>
              <label className="label" htmlFor={field.name}>
                {field.label}
              </label>
              <select className="select" id={field.name} name={field.name} defaultValue={String(value ?? "")} required={field.required}>
                <option value="">—</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (field.kind === "textarea" || field.kind === "richtext" || field.kind === "json") {
          return (
            <div className="field" key={field.name}>
              <label className="label" htmlFor={field.name}>
                {field.label}
              </label>
              <textarea className="textarea" id={field.name} name={field.name} rows={field.kind === "textarea" ? 3 : 6} defaultValue={toDisplayValue(field.kind, value)} required={field.required} />
              {field.helpText ? <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{field.helpText}</span> : null}
            </div>
          );
        }
        return (
          <div className="field" key={field.name}>
            <label className="label" htmlFor={field.name}>
              {field.label}
            </label>
            <input
              className="input"
              id={field.name}
              name={field.name}
              type={field.kind === "date" ? "date" : field.kind === "number" ? "number" : "text"}
              defaultValue={toDisplayValue(field.kind, value)}
              required={field.required}
            />
            {field.helpText ? <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{field.helpText}</span> : null}
          </div>
        );
      })}
      </fieldset>
      {state?.error ? <p className="error-text">{state.error}</p> : null}
      {state?.warning ? <p className="notice" role="status">{state.warning}</p> : null}
      {!readOnly ? (
        <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: "start" }}>
          {pending ? "Saving..." : submitLabel}
        </button>
      ) : null}
    </form>
  );
}
