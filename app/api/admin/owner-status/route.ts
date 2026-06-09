import { isOwnerAccessAuthorized } from "@/lib/admin/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe owner-access diagnostic (never exposes the secret). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerParamPresent = Boolean(url.searchParams.get("owner")?.trim());

  return Response.json({
    ok: true,
    ownerKeyConfigured: Boolean(process.env.OWNER_PRICING_KEY?.trim()),
    authorized: isOwnerAccessAuthorized(req),
    ownerParamPresent,
  });
}
