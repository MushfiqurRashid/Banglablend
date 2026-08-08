"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@bangla-blend/types";

type AddInput = { variantId: string; quantity: number };

interface CartContextValue {
  cart?: Cart;
  count: number;
  isOpen: boolean;
  isLoading: boolean;
  error?: string;
  open: () => void;
  close: () => void;
  addItem: (input: AddInput) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  resetCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

async function parseCart(response: Response): Promise<Cart | null> {
  const payload = (await response.json()) as { cart?: Cart; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Cart request failed.");
  return payload.cart ?? null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isOpen, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetch("/api/cart", { cache: "no-store" }).then(parseCart),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (request: { method: "POST" | "PATCH" | "DELETE"; body: object }) =>
      fetch("/api/cart", {
        method: request.method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.body),
      }).then(parseCart),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart"], cart);
      setError(undefined);
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : "Cart request failed."),
  });

  const value = useMemo<CartContextValue>(
    () => ({
      cart: cartQuery.data ?? undefined,
      count: cartQuery.data?.items.reduce((total, line) => total + line.quantity, 0) ?? 0,
      isOpen,
      isLoading: cartQuery.isLoading || mutation.isPending,
      error,
      open: () => setOpen(true),
      close: () => setOpen(false),
      addItem: async (input) => {
        try {
          await mutation.mutateAsync({ method: "POST", body: input });
        } finally {
          setOpen(true);
        }
      },
      updateItem: async (lineId, quantity) => {
        await mutation.mutateAsync({ method: "PATCH", body: { lineId, quantity } });
      },
      removeItem: async (lineId) => {
        await mutation.mutateAsync({ method: "DELETE", body: { lineId } });
      },
      resetCart: () => {
        queryClient.setQueryData(["cart"], null);
        setError(undefined);
        setOpen(false);
      },
    }),
    [cartQuery.data, cartQuery.isLoading, error, isOpen, mutation],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
