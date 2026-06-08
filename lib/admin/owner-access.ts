import { isOwnerPricingKeyValid } from "@/lib/flights/owner-pricing";

export function isOwnerAccessKeyValid(key: string | null | undefined): boolean {
  return isOwnerPricingKeyValid(key);
}

export function getOwnerAccessKeyFromRequest(req: Request): string | null {
  const url = new URL(req.url);
  const query = url.searchParams.get("owner")?.trim() || url.searchParams.get("key")?.trim();
  if (query) return query;

  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();

  const header = req.headers.get("x-owner-key");
  if (header?.trim()) return header.trim();

  return null;
}

export function isOwnerAccessAuthorized(req: Request): boolean {
  return isOwnerAccessKeyValid(getOwnerAccessKeyFromRequest(req));
}
