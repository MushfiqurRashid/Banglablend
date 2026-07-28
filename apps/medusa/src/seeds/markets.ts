export const sampleRegions = [
  { name: "Bangladesh", currency_code: "bdt", countries: ["bd"], payment_providers: ["pp_system_default"], metadata: { market_code: "bd", enabled: true, isPlaceholder: true } },
  { name: "United Kingdom", currency_code: "gbp", countries: ["gb"], payment_providers: ["pp_system_default"], metadata: { market_code: "gb", enabled: false, isPlaceholder: true } },
  { name: "United States", currency_code: "usd", countries: ["us"], payment_providers: ["pp_system_default"], metadata: { market_code: "us", enabled: false, isPlaceholder: true } }
];

export const sampleShippingOptions = [
  { name: "Dhaka standard delivery", market: "bd", price: 80, currency_code: "bdt", isPlaceholder: true },
  { name: "Bangladesh nationwide delivery", market: "bd", price: 130, currency_code: "bdt", isPlaceholder: true },
  { name: "International tracked delivery", market: "international", price: 1800, currency_code: "bdt", isPlaceholder: true }
];
