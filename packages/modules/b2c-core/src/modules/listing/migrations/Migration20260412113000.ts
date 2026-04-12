import { Migration } from "@mikro-orm/migrations";

export class Migration20260412113000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "listing" add constraint "listing_price_amount_positive_check" check ("price_amount" > 0);`,
    );
    this.addSql(
      `alter table "listing" add constraint "listing_quantity_available_nonnegative_check" check ("quantity_available" >= 0);`,
    );
    this.addSql(
      `alter table "listing" add constraint "listing_status_allowed_check" check ("status" in ('draft', 'active', 'reserved', 'sold', 'paused', 'archived'));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "listing" drop constraint if exists "listing_status_allowed_check";`,
    );
    this.addSql(
      `alter table "listing" drop constraint if exists "listing_quantity_available_nonnegative_check";`,
    );
    this.addSql(
      `alter table "listing" drop constraint if exists "listing_price_amount_positive_check";`,
    );
  }
}
