"use client";

import { useActionState } from "react";
import { createCatalogAction } from "../actions";
import { CatalogForm, emptyCatalogForm } from "../catalog-form";

export function NewCatalogClient() {
  const [state, formAction, pending] = useActionState(createCatalogAction, undefined);
  return <CatalogForm initial={emptyCatalogForm} formAction={formAction} state={state} pending={pending} submitLabel="Create category" />;
}
