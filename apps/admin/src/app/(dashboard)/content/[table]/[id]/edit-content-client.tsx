"use client";

import { useActionState } from "react";
import { updateContentAction } from "../actions";
import { ContentForm } from "../content-form";
import type { ContentTypeDef } from "@/lib/content-registry";

export function EditContentClient({
  contentType,
  id,
  initial,
  foreignOptions,
  readOnly = false,
}: {
  contentType: ContentTypeDef;
  id: string;
  initial: Record<string, unknown>;
  foreignOptions: Record<string, Array<{ id: string; label: string }>>;
  readOnly?: boolean;
}) {
  const boundAction = updateContentAction.bind(null, contentType.table, id);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  return <ContentForm contentType={contentType} initial={initial} foreignOptions={foreignOptions} formAction={formAction} state={state} pending={pending} submitLabel="Save changes" readOnly={readOnly} />;
}
