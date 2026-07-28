"use client";

import { useId, useState } from "react";

interface ProductInformationTabsProps {
  description: string;
  ingredients: string;
  usage: string;
  storage: string;
  shipping: string;
}

export function ProductInformationTabs({
  description,
  ingredients,
  usage,
  storage,
  shipping
}: ProductInformationTabsProps) {
  const id = useId();
  const tabs = [
    { id: "description", label: "Description", content: description },
    { id: "ingredients", label: "Ingredients", content: ingredients },
    { id: "how-to-use", label: "How to use", content: usage },
    { id: "storage", label: "Storage", content: storage },
    { id: "shipping", label: "Shipping & returns", content: shipping }
  ] as const;
  const [activeId, setActiveId] = useState<(typeof tabs)[number]["id"]>("description");
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="pdp-tabs-card">
      <div className="pdp-tab-list" role="tablist" aria-label="Product information">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`${id}-${tab.id}-tab`}
            type="button"
            role="tab"
            aria-selected={activeId === tab.id}
            aria-controls={`${id}-${tab.id}-panel`}
            tabIndex={activeId === tab.id ? 0 : -1}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`${id}-${active.id}-panel`}
        className="pdp-tab-panel"
        role="tabpanel"
        aria-labelledby={`${id}-${active.id}-tab`}
      >
        <p>{active.content}</p>
      </div>
    </div>
  );
}
