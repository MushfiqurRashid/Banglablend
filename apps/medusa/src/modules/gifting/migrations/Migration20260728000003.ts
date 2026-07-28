import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260728000003 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "gift_order" (
        "id" text not null,
        "cart_id" text not null,
        "order_id" text null,
        "recipient_name" text not null,
        "recipient_telephone" text not null,
        "gift_message" text null,
        "hide_prices" boolean not null default false,
        "packaging_selection" text null,
        "preferred_delivery_date" timestamptz null,
        "delivery_instructions" text null,
        "occasion" text null,
        "corporate_order_reference" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "gift_order_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `create unique index if not exists "IDX_gift_order_cart_id_unique" on "gift_order" ("cart_id") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_gift_order_deleted_at" on "gift_order" ("deleted_at") where deleted_at is null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gift_order" cascade;`);
  }
}
