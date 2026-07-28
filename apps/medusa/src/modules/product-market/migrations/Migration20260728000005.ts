import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260728000005 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "product_market" (
        "id" text not null,
        "product_id" text not null,
        "bangladesh_available" boolean not null default true,
        "international_available" boolean not null default false,
        "supported_countries" text[] not null default '{}',
        "restricted_countries" text[] not null default '{}',
        "export_ready" boolean not null default false,
        "domestic_only" boolean not null default false,
        "shipping_classification" text null,
        "customs_description" text null,
        "country_of_origin" text null,
        "package_dimensions" jsonb null,
        "storage_requirements" text null,
        "temperature_requirements" text null,
        "shelf_life_days" integer null,
        "minimum_shelf_life_at_dispatch_days" integer null,
        "verified" boolean not null default false,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_market_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `create unique index if not exists "IDX_product_market_product_id_unique" on "product_market" ("product_id") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_product_market_deleted_at" on "product_market" ("deleted_at") where deleted_at is null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_market" cascade;`);
  }
}
