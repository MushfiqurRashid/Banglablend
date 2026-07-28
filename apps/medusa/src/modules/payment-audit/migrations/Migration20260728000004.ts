import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260728000004 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "payment_audit" (
        "id" text not null,
        "provider" text not null,
        "transaction_id" text not null,
        "order_reference" text null,
        "event_type" text not null,
        "status" text not null,
        "amount" numeric null,
        "currency" text null,
        "idempotency_key" text not null,
        "payload_hash" text not null,
        "safe_payload" jsonb null,
        "processed_at" timestamptz null,
        "raw_amount" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "payment_audit_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `create unique index if not exists "IDX_payment_audit_idempotency_key_unique" on "payment_audit" ("idempotency_key") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_payment_audit_deleted_at" on "payment_audit" ("deleted_at") where deleted_at is null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_audit" cascade;`);
  }
}
