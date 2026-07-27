/**
 * SQLite compatibility helpers.
 * SQLite stores arrays as comma-separated strings.
 * These helpers convert them back to arrays for the API layer.
 */

export function parseStringArray(value: unknown): string[] {
  if (!value || typeof value !== "string") return [];
  return value.split(",").filter(Boolean);
}

export function parseServiceArrays<T extends Record<string, unknown>>(service: T): T {
  return {
    ...service,
    images: parseStringArray(service.images),
    languages: parseStringArray(service.languages),
  };
}

export function parseReviewArrays<T extends Record<string, unknown>>(review: T): T {
  return {
    ...review,
    photos: parseStringArray(review.photos),
  };
}

export function parseBlogArrays<T extends Record<string, unknown>>(post: T): T {
  return {
    ...post,
    tags: parseStringArray(post.tags),
  };
}
