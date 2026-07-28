import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260728000006 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "product_origin" (
        "id" text not null,
        "product_id" text not null,
        "division" text null,
        "district" text null,
        "locality" text null,
        "producer_reference" text null,
        "harvest_date" timestamptz null,
        "batch_number" text null,
        "latitude" numeric null,
        "longitude" numeric null,
        "verification_status" text check ("verification_status" in ('draft', 'in_review', 'verified', 'rejected')) not null default 'draft',
        "evidence_reference" text null,
        "raw_latitude" jsonb null,
        "raw_longitude" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_origin_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `create unique index if not exists "IDX_product_origin_product_id_unique" on "product_origin" ("product_id") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_product_origin_deleted_at" on "product_origin" ("deleted_at") where deleted_at is null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_origin" cascade;`);
  }
}
