import { Migration } from '@mikro-orm/migrations';

export class Migration20260410110000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "listing" ("id" text not null, "print_id" text not null, "seller_id" text not null, "price_amount" numeric not null, "currency_code" text not null, "condition_code" text not null, "quantity_available" int not null, "status" text not null, "seller_note" text null, "photos" jsonb null, "location_country" text null, "shipping_profile_id" text null, "raw_price_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "listing_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_listing_deleted_at" ON "listing" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_listing_print_id" ON "listing" (print_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_listing_seller_id" ON "listing" (seller_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_listing_status" ON "listing" (status) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "listing" cascade;`);
  }

}
