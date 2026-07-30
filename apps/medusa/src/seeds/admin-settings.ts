export const defaultAdminSettings = [
  {
    key: "branding.site_name",
    group: "branding",
    label: "Site name",
    description: "Brand name shown to customers across connected storefronts.",
    value: "Bangla Blend",
    value_type: "string" as const,
    is_public: true,
    is_secret: false,
    sort_order: 10
  },
  {
    key: "support.email",
    group: "support",
    label: "Support email",
    description: "Primary support address for customers.",
    value: "hello@example.com",
    value_type: "string" as const,
    is_public: true,
    is_secret: false,
    sort_order: 10
  },
  {
    key: "support.phone",
    group: "support",
    label: "Support telephone",
    description: "Optional public support telephone number.",
    value: "",
    value_type: "string" as const,
    is_public: true,
    is_secret: false,
    sort_order: 20
  },
  {
    key: "storefront.maintenance_mode",
    group: "storefront",
    label: "Maintenance mode",
    description: "Public operational flag for connected storefront deployments. Deployment middleware must opt in before enabling.",
    value: false,
    value_type: "boolean" as const,
    is_public: true,
    is_secret: false,
    sort_order: 10
  },
  {
    key: "catalog.default_market",
    group: "catalog",
    label: "Default market",
    description: "Default merchandising market code.",
    value: "bd",
    value_type: "string" as const,
    is_public: true,
    is_secret: false,
    sort_order: 10
  },
  {
    key: "catalog.low_stock_threshold",
    group: "catalog",
    label: "Low stock threshold",
    description: "Operations threshold used for dashboard attention queues.",
    value: 10,
    value_type: "number" as const,
    is_public: false,
    is_secret: false,
    sort_order: 20
  },
  {
    key: "catalog.verification_required",
    group: "catalog",
    label: "Require catalog verification",
    description: "Documents the storefront publishing policy, which stays closed by default.",
    value: true,
    value_type: "boolean" as const,
    is_public: false,
    is_secret: false,
    sort_order: 30
  },
  {
    key: "content.studio_url",
    group: "content",
    label: "Editorial Studio URL",
    description: "Launch URL shown to superadmins for narrative content management.",
    value: "http://localhost:3333",
    value_type: "string" as const,
    is_public: false,
    is_secret: false,
    sort_order: 10
  },
  {
    key: "orders.manual_review_threshold",
    group: "orders",
    label: "Manual review threshold",
    description: "Documented order value threshold for operations review, in the default market currency.",
    value: 25000,
    value_type: "number" as const,
    is_public: false,
    is_secret: false,
    sort_order: 10
  }
];
