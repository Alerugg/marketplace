export const LISTING_STATUSES = [
  "draft",
  "active",
  "reserved",
  "sold",
  "paused",
  "archived",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];
