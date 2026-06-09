"use client";

import type {
  FlightAvailableService,
  FlightOfferSummary,
  SelectedFlightService,
} from "@/lib/duffel/types";
import { computeFlightCheckoutTotals } from "@/lib/flights/ancillaries";
import { formatMoney } from "@/lib/flights/format";

type Props = {
  offer: FlightOfferSummary;
  selections: Record<string, number>;
  onChange: (selections: Record<string, number>) => void;
};

function buildSelected(selections: Record<string, number>): SelectedFlightService[] {
  return Object.entries(selections)
    .filter(([, qty]) => qty > 0)
    .map(([serviceId, quantity]) => ({ serviceId, quantity }));
}

function serviceDetail(svc: FlightAvailableService, offer: FlightOfferSummary): string {
  const parts: string[] = [];
  if (svc.passengerIds.length === 1 && offer.passengerIds.length > 1) {
    parts.push("1 passenger");
  } else if (svc.passengerIds.length > 0) {
    parts.push(`${svc.passengerIds.length} passenger(s)`);
  }
  if (svc.segmentIds.length > 0) {
    parts.push(`${svc.segmentIds.length} segment(s)`);
  }
  return parts.join(" · ");
}

export function FlightExtraBagsSection({ offer, selections, onChange }: Props) {
  const services = offer.availableServices ?? [];
  const includedSummary = offer.fareRules?.baggageSummary;

  const selected = buildSelected(selections);
  const totals = computeFlightCheckoutTotals(offer, selected, offer.markupPercent);
  const hasSelection = selected.length > 0;
  const hasExtras = services.length > 0;

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-bold text-stone-900">Baggage</h2>
      <p className="mt-2 text-sm text-stone-600">
        Included bags are part of your fare. When the airline supports it, you can add paid
        checked bags here — they are included in your total before you pay.
      </p>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Included with this fare
        </p>
        <p className="mt-1 text-sm font-medium text-stone-900">
          {includedSummary ?? "See fare rules above for carry-on and checked bag allowance."}
        </p>
      </div>

      {hasExtras ? (
        <>
          <h3 className="mt-6 text-sm font-semibold text-stone-900">Add extra bags</h3>
          <ul className="mt-3 space-y-3">
            {services.map((svc) => {
              const qty = selections[svc.id] ?? 0;
              const lineTotal = (Number.parseFloat(svc.totalAmount) * qty).toFixed(2);
              return (
                <li
                  key={svc.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{svc.label}</p>
                      <p className="mt-1 text-xs text-stone-500">{serviceDetail(svc, offer)}</p>
                      <p className="mt-1 text-sm text-stone-700">
                        {formatMoney(svc.totalAmount, svc.totalCurrency)} each
                        {svc.maximumQuantity > 1 ? ` · max ${svc.maximumQuantity}` : ""}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-800">
                      <span className="sr-only">Quantity for {svc.label}</span>
                      <select
                        value={String(qty)}
                        onChange={(e) => {
                          const next = Number.parseInt(e.target.value, 10);
                          onChange({ ...selections, [svc.id]: next });
                        }}
                        className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm font-semibold"
                      >
                        {Array.from({ length: svc.maximumQuantity + 1 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? "None" : i}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {qty > 0 ? (
                    <p className="mt-2 text-sm font-medium text-stone-800">
                      Subtotal: {formatMoney(lineTotal, svc.totalCurrency)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {hasSelection ? (
            <p className="mt-4 text-sm text-stone-700">
              Extra bags (before service fee):{" "}
              <strong>{formatMoney(totals.servicesSupplierAmount, totals.currency)}</strong>
              {" · "}
              New trip total:{" "}
              <strong>{formatMoney(totals.customerAmount, totals.currency)}</strong>
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          This airline does not offer paid extra bags through our checkout for this fare. You
          can still travel with the included allowance above, or contact the airline after
          booking if you need to add bags.
        </p>
      )}
    </section>
  );
}

export function getSelectedServicesFromRecord(
  selections: Record<string, number>,
): SelectedFlightService[] {
  return buildSelected(selections);
}
