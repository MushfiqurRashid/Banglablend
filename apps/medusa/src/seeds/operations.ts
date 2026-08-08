export const sampleCategories = [
  {
    name: "Originals",
    handle: "originals",
    is_active: true,
    is_internal: false,
    metadata: { storefront_section: true, verified: true },
  },
  {
    name: "Reserve",
    handle: "reserve",
    is_active: true,
    is_internal: false,
    metadata: { storefront_section: true, verified: true },
  },
  {
    name: "Spice blends",
    handle: "spice-blends",
    is_active: true,
    is_internal: false,
    metadata: { isPlaceholder: true, verified: false },
  },
  {
    name: "Ingredients from one origin",
    handle: "single-origin-ingredients",
    is_active: true,
    is_internal: false,
    metadata: { isPlaceholder: true, verified: false },
  },
  {
    name: "Pantry",
    handle: "pantry",
    is_active: true,
    is_internal: false,
    metadata: { storefront_section: true, verified: true },
  },
  {
    name: "Tea & Wellness",
    handle: "tea-wellness",
    is_active: true,
    is_internal: false,
    metadata: { storefront_section: true, verified: true },
  },
  {
    name: "Lifestyle Accessories",
    handle: "lifestyle-accessories",
    is_active: true,
    is_internal: false,
    metadata: { storefront_section: true, verified: true },
  },
  {
    name: "Gifts",
    handle: "gifts",
    is_active: true,
    is_internal: false,
    metadata: { storefront_section: true, verified: true },
  },
];

export const sampleStorefrontCatalogs = [
  {
    name: "Build a Box",
    handle: "build-a-box",
    description: "Choose three eligible Bangla Blend products to create your own gift box.",
    parentHandle: "gifts",
    is_active: true,
    is_internal: false,
    metadata: {
      storefront_catalog: true,
      storefront_experience: "build_a_box",
      box_size: 3,
      verified: true,
    },
  },
] as const;

export const samplePromotions = [
  {
    code: "SAMPLE-WELCOME-10",
    type: "standard",
    status: "draft",
    is_automatic: false,
    application_method: {
      type: "percentage",
      target_type: "items",
      allocation: "across",
      value: 10,
    },
    campaign: {
      name: "Sample welcome campaign",
      campaign_identifier: "sample-welcome",
      description: "Draft promotion for development environments.",
    },
  },
] as const;

export const sampleCustomers = [
  {
    first_name: "Sample",
    last_name: "Customer",
    email: "sample.customer@example.invalid",
    has_account: false,
    metadata: { isPlaceholder: true, verified: false, test_data: true },
  },
];

export const sampleInventoryBySku: Record<string, number> = {
  "SAMPLE-MEZ-75": 30,
  "SAMPLE-MEZ-100": 20,
  "SAMPLE-BLK-75": 20,
  "SAMPLE-WPP-75": 18,
  "SAMPLE-FSH-75": 24,
  "SAMPLE-FSH-100": 18,
  "SAMPLE-HTZ-100": 12,
  "SAMPLE-HTZ-125": 10,
  "SAMPLE-SHA-75": 26,
  "SAMPLE-SHA-100": 20,
};
