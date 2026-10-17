/** Returns a Cloudinary transformation URL for a given publicId/url.
 *  Falls through unchanged for non-Cloudinary URLs (e.g. /images/...) */
export function clImg(
  url: string | null | undefined,
  width = 400,
  height?: number,
): string | undefined {
  if (!url) return undefined;
  // Only transform Cloudinary URLs
  if (!url.includes("res.cloudinary.com") && !url.includes("cloudinary.com")) return url;
  const h = height ? `,h_${height}` : "";
  // Insert transformation before /upload/
  return url.replace(/\/upload\//, `/upload/f_auto,q_auto,w_${width}${h},c_fill/`);
}
