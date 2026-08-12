"use client";

import { useActionState } from "react";
import { updateProductAction } from "../actions";
import { ProductForm, type ProductFormValues } from "../product-form";

export function EditProductClient({ productId, initial, catalogs, readOnly = false }: { productId: string; initial: ProductFormValues; catalogs: Array<{ id: string; name: string; section: string }>; readOnly?: boolean }) {
  const boundAction = updateProductAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  return <ProductForm mode="edit" initial={initial} catalogs={catalogs} formAction={formAction} state={state} pending={pending} submitLabel="Save changes" readOnly={readOnly} />;
}
