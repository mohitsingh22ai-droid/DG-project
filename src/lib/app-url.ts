/**
 * Public address of the site, used for links that leave the site and come back
 * (Stripe return pages, email links).
 *
 * NEXT_PUBLIC_APP_URL wins when it is set, except when it still points at
 * localhost while the request came from a real domain: that is a deployment
 * that kept the local-development value, and sending customers to localhost
 * after payment would strand them.
 */
const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);

export function appOrigin(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configured && !(isLocal(configured) && requestOrigin && !isLocal(requestOrigin))) return configured;
  return requestOrigin || configured || "http://localhost:3000";
}
