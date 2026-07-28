import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260728000002 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "inquiry" (
        "id" text not null,
        "type" text check ("type" in ('contact', 'newsletter', 'wholesale', 'corporate')) not null,
        "status" text check ("status" in ('new', 'acknowledged', 'in_progress', 'closed')) not null default 'new',
        "company" text null,
        "contact_person" text null,
        "email" text not null,
        "telephone" text null,
        "quantity" integer null,
        "budget" text null,
        "occasion" text null,
        "delivery_date" timestamptz null,
        "delivery_locations" text null,
        "packaging" text null,
        "message_card" text null,
        "notes" text null,
        "assigned_staff_id" text null,
        "internal_notes" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "inquiry_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `create index if not exists "IDX_inquiry_deleted_at" on "inquiry" ("deleted_at") where deleted_at is null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "inquiry" cascade;`);
  }
}
