import { Migration } from "@mikro-orm/migrations";

export class Migration20260413120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "listing" add constraint "listing_active_requires_quantity_check" check ("status" <> 'active' or "quantity_available" > 0);`,
    );
    this.addSql(
      `alter table "listing" add constraint "listing_sold_requires_zero_quantity_check" check ("status" <> 'sold' or "quantity_available" = 0);`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "listing" drop constraint if exists "listing_sold_requires_zero_quantity_check";`,
    );
    this.addSql(
      `alter table "listing" drop constraint if exists "listing_active_requires_quantity_check";`,
    );
  }
}
