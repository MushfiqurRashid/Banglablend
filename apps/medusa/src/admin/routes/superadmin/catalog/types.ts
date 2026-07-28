export interface CatalogReadiness {
  ready: boolean;
  missing: string[];
  checks: Record<string, boolean>;
}

export interface CatalogProduct {
  id: string;
  title: string;
  handle: string;
  subtitle?: string | null;
  description?: string | null;
  status: "draft" | "proposed" | "published" | "rejected";
  thumbnail?: string | null;
  images: Array<{ id?: string; url: string }>;
  collection?: { id?: string; title?: string; handle?: string } | null;
  tags: Array<{ id?: string; value?: string }>;
  metadata: Record<string, unknown>;
  variants: Array<{
    id: string;
    title?: string;
    sku?: string | null;
    inventory_quantity?: number;
    prices?: Array<{ amount?: number; currency_code?: string }>;
  }>;
  readiness: CatalogReadiness;
  market_profile?: {
    bangladesh_available?: boolean;
    international_available?: boolean;
    supported_countries?: string[];
    restricted_countries?: string[];
    export_ready?: boolean;
    domestic_only?: boolean;
    shipping_classification?: string | null;
    customs_description?: string | null;
    country_of_origin?: string | null;
    storage_requirements?: string | null;
    temperature_requirements?: string | null;
    shelf_life_days?: number | null;
    minimum_shelf_life_at_dispatch_days?: number | null;
    verified?: boolean;
  } | null;
  origin_profile?: {
    division?: string | null;
    district?: string | null;
    locality?: string | null;
    producer_reference?: string | null;
    harvest_date?: string | null;
    batch_number?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    verification_status?: "draft" | "in_review" | "verified" | "rejected";
    evidence_reference?: string | null;
  } | null;
}

export interface CatalogResponse {
  products: CatalogProduct[];
  count: number;
  offset: number;
  limit: number;
}
