import { Migration } from "@mikro-orm/migrations";

export class Migration20260502003000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "listing" add column if not exists "product_variant_id" text null;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_listing_product_variant_id" ON "listing" (product_variant_id) WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_listing_product_variant_id";`);
    this.addSql(
      `alter table "listing" drop column if exists "product_variant_id";`,
    );
  }
}
