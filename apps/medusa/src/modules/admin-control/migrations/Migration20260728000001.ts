import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260728000001 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "app_setting" (
        "id" text not null,
        "key" text not null,
        "group" text not null default 'general',
        "label" text not null,
        "description" text null,
        "value" jsonb not null,
        "value_type" text check ("value_type" in ('string', 'number', 'boolean', 'json')) not null default 'string',
        "is_public" boolean not null default false,
        "is_secret" boolean not null default false,
        "sort_order" integer not null default 0,
        "updated_by" text null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "app_setting_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `create unique index if not exists "IDX_app_setting_key_unique" on "app_setting" ("key") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_app_setting_group" on "app_setting" ("group") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_app_setting_deleted_at" on "app_setting" ("deleted_at") where deleted_at is null;`,
    );

    this.addSql(
      `create table if not exists "admin_audit_log" (
        "id" text not null,
        "actor_id" text not null,
        "actor_email" text null,
        "action" text not null,
        "resource_type" text not null,
        "resource_id" text null,
        "resource_label" text null,
        "summary" text not null,
        "before" jsonb null,
        "after" jsonb null,
        "request_id" text null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "admin_audit_log_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `create index if not exists "IDX_admin_audit_log_resource_type" on "admin_audit_log" ("resource_type") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_admin_audit_log_action" on "admin_audit_log" ("action") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_admin_audit_log_actor_id" on "admin_audit_log" ("actor_id") where deleted_at is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_admin_audit_log_deleted_at" on "admin_audit_log" ("deleted_at") where deleted_at is null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "admin_audit_log" cascade;`);
    this.addSql(`drop table if exists "app_setting" cascade;`);
  }
}
