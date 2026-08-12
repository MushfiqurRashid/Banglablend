"use client";

import { useActionState } from "react";
import { updateCatalogAction } from "../actions";
import { CatalogForm, type CatalogFormValues } from "../catalog-form";

export function EditCatalogClient({ catalogId, initial, readOnly = false }: { catalogId: string; initial: CatalogFormValues; readOnly?: boolean }) {
  const boundAction = updateCatalogAction.bind(null, catalogId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  return <CatalogForm initial={initial} formAction={formAction} state={state} pending={pending} submitLabel="Save changes" readOnly={readOnly} />;
}
