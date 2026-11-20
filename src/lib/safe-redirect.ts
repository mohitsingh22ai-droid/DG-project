/**
 * Returns `target` only when it is a path on this site (e.g. "/checkout?draft=…").
 * Prevents ?redirect= from sending a signed-in user to another website.
 */
export function safeRedirect(target: string | null | undefined): string | null {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return null;
  return target;
}
