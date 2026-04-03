import Link from "next/link";
import { hasAnyAffiliateTracking } from "@/lib/partner-links";
import { site } from "@/lib/site";

type Props = {
  className?: string;
  /** `compact` = bordered note; `inline` = single paragraph for prose flow */
  variant?: "compact" | "inline";
};

/**
 * Short notice for pages that link to booking partners—commission language only
 * when tracked affiliate URLs are configured.
 */
export function AffiliateDisclosureBlock({
  className = "",
  variant = "compact",
}: Props) {
  const tracked = hasAnyAffiliateTracking();

  const body = tracked ? (
    <>
      {site.name} may earn a commission if you use certain links and complete a
      qualifying booking or purchase.{" "}
      <strong className="font-semibold text-stone-800">
        You are not charged extra
      </strong>{" "}
      for using our links.
    </>
  ) : (
    <>
      Outbound links open partner sites (for example hotels or flights) in a new
      tab so you can compare prices and policies.{" "}
      <strong className="font-semibold text-stone-800">
        Tracked affiliate links are not active on this site yet;
      </strong>{" "}
      when they are, our disclosure will describe how that works.
    </>
  );

  const noteLabel = tracked ? "Affiliate note:" : "Partner links:";

  if (variant === "inline") {
    return (
      <p className={`text-sm leading-relaxed text-stone-600 ${className}`}>
        {body}{" "}
        <Link
          href="/affiliate-disclosure"
          className="font-semibold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
        >
          {tracked ? "Full disclosure" : "Read our disclosure"}
        </Link>
        .
      </p>
    );
  }

  return (
    <aside
      className={`rounded-xl border border-amber-200/70 bg-amber-50/60 p-4 text-sm leading-relaxed text-stone-700 ${className}`}
      role="note"
    >
      <p>
        <strong className="text-stone-900">{noteLabel}</strong> {body}
      </p>
      <p className="mt-2">
        <Link
          href="/affiliate-disclosure"
          className="font-semibold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
        >
          {tracked
            ? "Read our affiliate disclosure"
            : "Partner & affiliate disclosure"}
        </Link>
        .
      </p>
    </aside>
  );
}
