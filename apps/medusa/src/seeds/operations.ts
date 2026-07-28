export const sampleCategories = [
  { name: "Spice blends", handle: "spice-blends", is_active: true, is_internal: false, metadata: { isPlaceholder: true, verified: false } },
  { name: "Single-origin ingredients", handle: "single-origin-ingredients", is_active: true, is_internal: false, metadata: { isPlaceholder: true, verified: false } },
  { name: "Pantry", handle: "pantry", is_active: true, is_internal: false, metadata: { isPlaceholder: true, verified: false } },
  { name: "Gifts", handle: "gifts", is_active: true, is_internal: false, metadata: { isPlaceholder: true, verified: false } }
];

export const samplePromotions = [
  {
    code: "SAMPLE-WELCOME-10",
    type: "standard",
    status: "draft",
    is_automatic: false,
    application_method: { type: "percentage", target_type: "items", allocation: "across", value: 10 },
    campaign: { name: "Sample welcome campaign", campaign_identifier: "sample-welcome", description: "Development-only draft promotion." }
  }
] as const;

export const sampleCustomers = [
  { first_name: "Sample", last_name: "Customer", email: "sample.customer@example.invalid", has_account: false, metadata: { isPlaceholder: true, verified: false, test_data: true } }
];

export const sampleInventoryBySku: Record<string, number> = {
  "SAMPLE-MEZ-80": 30,
  "SAMPLE-FSH-80": 24,
  "SAMPLE-ILI-80": 32,
  "SAMPLE-HTZ-60": 12,
  "SAMPLE-TUR-70": 14,
  "SAMPLE-GIN-200": 40,
  "SAMPLE-TEA-70": 20,
  "SAMPLE-GFT-06": 16,
  "SAMPLE-GFT-TRIO": 28,
  "SAMPLE-GFT-CHAI": 22,
  "SAMPLE-GFT-COAST": 18,
  "SAMPLE-GFT-PANTRY": 14,
  "SAMPLE-GFT-GOLD": 17,
  "SAMPLE-GFT-CTG": 11,
  "SAMPLE-GFT-SAMPLE": 35,
  "SAMPLE-GFT-START": 19,
  "SAMPLE-GFT-FEST": 8
};
