"use client";

import { Archive, Trash2 } from "lucide-react";

export function ConfirmSubmitButton({
  children,
  message,
  kind = "delete",
}: {
  children: React.ReactNode;
  message: string;
  kind?: "delete" | "archive";
}) {
  const Icon = kind === "archive" ? Archive : Trash2;
  return (
    <button
      className="btn btn-danger"
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <Icon aria-hidden="true" />
      {children}
    </button>
  );
}
