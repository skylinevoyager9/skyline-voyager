import type { FareRulesSummary } from "@/lib/duffel/types";
import { formatMoney } from "@/lib/flights/format";

type DuffelCondition = {
  allowed?: boolean;
  penalty_amount?: string | null;
  penalty_currency?: string | null;
};

type DuffelConditions = {
  change_before_departure?: DuffelCondition | null;
  refund_before_departure?: DuffelCondition | null;
};

function formatPenalty(amount?: string | null, currency?: string | null): string | null {
  if (!amount || !currency) return null;
  return formatMoney(amount, currency);
}

export function parseDuffelFareRules(
  conditions?: DuffelConditions | null,
  baggageSummary?: string | null,
): FareRulesSummary {
  const change = conditions?.change_before_departure;
  const refund = conditions?.refund_before_departure;

  return {
    changeAllowed: change?.allowed ?? null,
    changePenalty: formatPenalty(change?.penalty_amount, change?.penalty_currency),
    refundAllowed: refund?.allowed ?? null,
    refundPenalty: formatPenalty(refund?.penalty_amount, refund?.penalty_currency),
    baggageSummary: baggageSummary ?? null,
  };
}

export function fareRulesToLines(rules: FareRulesSummary): string[] {
  const lines: string[] = [];
  if (rules.changeAllowed === true) {
    lines.push(
      rules.changePenalty
        ? `Changes before departure allowed (fee about ${rules.changePenalty}).`
        : "Changes before departure may be allowed — check airline rules.",
    );
  } else if (rules.changeAllowed === false) {
    lines.push("Changes before departure not allowed on this fare.");
  }
  if (rules.refundAllowed === true) {
    lines.push(
      rules.refundPenalty
        ? `Refunds before departure may be available (fee about ${rules.refundPenalty}).`
        : "Refunds before departure may be available — check airline rules.",
    );
  } else if (rules.refundAllowed === false) {
    lines.push("Non-refundable fare.");
  }
  if (rules.baggageSummary) {
    lines.push(rules.baggageSummary);
  }
  return lines;
}
