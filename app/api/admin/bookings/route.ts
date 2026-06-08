import { listRecentBookings } from "@/lib/bookings/store";
import type { StoredBooking } from "@/lib/bookings/types";
import { isOwnerAccessAuthorized } from "@/lib/admin/owner-access";
import { isRedisKvConfigured } from "@/lib/storage/redis-kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isOwnerAccessAuthorized(req)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized. Pass ?owner=OWNER_PRICING_KEY or Authorization: Bearer <key>.",
      },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "100") || 100));
  const bookings = await listRecentBookings(limit);

  return Response.json({
    ok: true,
    count: bookings.length,
    storage: isRedisKvConfigured() ? "upstash" : "local_file",
    bookings,
  });
}

export type AdminBookingsResponse = {
  ok: true;
  count: number;
  storage: string;
  bookings: StoredBooking[];
};
