/** Shared care-type options for homepage hero search and /search filters. */
export const SEARCH_SERVICE_OPTIONS = [
  "Dog Walking",
  "Pet Sitting",
  "Boarding",
  "Doggy Day Care",
  "Drop-In Visits",
  "House Sitting",
  "Training Support",
  "Medication Help",
  "Custom Care",
] as const;

export type SearchServiceOption = (typeof SEARCH_SERVICE_OPTIONS)[number];
