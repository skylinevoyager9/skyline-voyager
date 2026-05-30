import { Suspense } from "react";
import { FlightManageBooking } from "@/components/flights/FlightManageBooking";

export const metadata = {
  title: "Manage flight booking | Skyline Voyager",
  description: "View your order and request voluntary flight changes when allowed by the airline.",
};

export default function FlightManagePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Manage booking</h1>
      <p className="mt-2 text-sm text-stone-600">
        Change dates, cancel when allowed, or review refunds per airline fare rules. Schedule
        changes initiated by the airline are handled via email alerts.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-stone-600">Loading…</p>}>
          <FlightManageBooking />
        </Suspense>
      </div>
    </main>
  );
}
