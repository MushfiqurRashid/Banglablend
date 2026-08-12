"use client";

import { useActionState } from "react";
import { createContentAction } from "../actions";
import { ContentForm } from "../content-form";
import type { ContentTypeDef } from "@/lib/content-registry";

export function NewContentClient({ contentType, foreignOptions }: { contentType: ContentTypeDef; foreignOptions: Record<string, Array<{ id: string; label: string }>> }) {
  const boundAction = createContentAction.bind(null, contentType.table);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const initial: Record<string, unknown> = {};
  if (contentType.hasVerification) initial.verification_status = "draft";
  if (contentType.hasLanguage) initial.language = "en";
  return <ContentForm contentType={contentType} initial={initial} foreignOptions={foreignOptions} formAction={formAction} state={state} pending={pending} submitLabel="Create" />;
}
