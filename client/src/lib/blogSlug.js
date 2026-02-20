const safeDecode = (value = "") => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const normalizeBlogSlug = (value = "") =>
  safeDecode(String(value ?? ""))
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getBlogSlug = (blog = {}) => {
  const rawSlug =
    typeof blog?.slug === "string" && blog.slug.trim()
      ? blog.slug
      : blog?.title || "";
  return normalizeBlogSlug(rawSlug);
};
