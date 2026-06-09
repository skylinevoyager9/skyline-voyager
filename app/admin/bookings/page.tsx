import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminBookingsClient } from "@/components/admin/AdminBookingsClient";
import { getBookingOwnerNotificationEmail } from "@/lib/email/owner-notification";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bookings (owner)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function AdminBookingsPage() {
  const ownerInbox = getBookingOwnerNotificationEmail() ?? site.email;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-sm text-stone-600">Loading…</p>}>
        <AdminBookingsClient />
      </Suspense>

      <p className="mt-8 text-xs text-stone-500">
        Confirmation emails BCC: {ownerInbox}. Full ticket details: Duffel dashboard.
      </p>

      <Link href="/" className="mt-4 inline-block text-sm text-stone-600 hover:underline">
        ← Home
      </Link>
    </main>
  );
}
