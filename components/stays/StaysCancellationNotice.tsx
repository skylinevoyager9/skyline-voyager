import type { StayQuoteSummary, StayRateSummary } from "@/lib/duffel/stays-types";
import { formatMoney } from "@/lib/flights/format";

type Props = {
  timeline: StayRateSummary["cancellationTimeline"] | StayQuoteSummary["cancellationTimeline"];
  currency: string;
};

export function StaysCancellationNotice({ timeline, currency }: Props) {
  if (!timeline.length) {
    return (
      <p className="text-sm text-amber-900/90">
        Cancellation policy: non-refundable or restrictions apply. Review before you pay.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-stone-700">
      <p className="font-semibold text-stone-900">Cancellation policy</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {timeline.map((step) => (
          <li key={step.before}>
            Full/partial refund of {formatMoney(step.refundAmount, step.currency || currency)} if
            cancelled before {new Date(step.before).toLocaleString()}.
          </li>
        ))}
      </ul>
    </div>
  );
}
