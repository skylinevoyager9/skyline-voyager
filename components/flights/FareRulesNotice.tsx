import type { FareRulesSummary } from "@/lib/duffel/types";
import { fareRulesToLines } from "@/lib/flights/fare-rules";

type Props = {
  rules?: FareRulesSummary;
  className?: string;
};

export function FareRulesNotice({
  rules,
  className = "mt-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-600",
}: Props) {
  if (!rules) return null;
  const lines = fareRulesToLines(rules);
  if (lines.length === 0) return null;

  return (
    <div className={className}>
      <p className="font-semibold text-stone-800">Fare rules (summary)</p>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-stone-500">
        Airline rules apply at booking. For changes or refunds, contact us with your booking
        reference.
      </p>
    </div>
  );
}
