"use client";

import { useActionState } from "react";
import { createProductAction } from "../actions";
import { ProductForm, emptyProductForm } from "../product-form";

export function NewProductClient({ catalogs }: { catalogs: Array<{ id: string; name: string; section: string }> }) {
  const [state, formAction, pending] = useActionState(createProductAction, undefined);
  return <ProductForm mode="create" initial={emptyProductForm} catalogs={catalogs} formAction={formAction} state={state} pending={pending} submitLabel="Create product" />;
}
