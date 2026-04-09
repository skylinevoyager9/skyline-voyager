import Link from "next/link";
import {
  hasAnyAffiliateTracking,
  partnerPublicBrandName,
} from "@/lib/partner-links";

/**
 * Visible booking-context note for guides (FTC-style transparency + OTA alignment).
 */
export function GuideArticlePartnerNote() {
  const affiliateOn = hasAnyAffiliateTracking();
  const bookingBrand = partnerPublicBrandName("booking");

  return (
    <aside className="mb-6 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 to-stone-50/80 px-4 py-3.5 text-sm leading-relaxed text-stone-700 shadow-sm ring-1 ring-amber-900/5 sm:px-5">
      <p className="font-semibold text-stone-900">How booking works on this page</p>
      <p className="mt-2">
        {affiliateOn ? (
          <>
            Some links may be <strong>affiliate links</strong>. If you book or buy
            through them, we may earn a commission at <strong>no extra cost</strong>{" "}
            to you. You complete checkout on the partner site—often including{" "}
            <strong>{bookingBrand}</strong> for stays—where rates and policies are
            set.
          </>
        ) : (
          <>
            Outbound links open trusted booking and search sites in a{" "}
            <strong>new tab</strong>—including <strong>{bookingBrand}</strong> for
            hotel search when you use our stay tools.{" "}
            <strong>Tracked affiliate IDs are not active yet;</strong> when they
            are, we will label them and update our{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-semibold text-amber-900 underline decoration-amber-900/35 underline-offset-2 hover:decoration-amber-900"
            >
              affiliate disclosure
            </Link>
            . You never pay a higher room rate on our behalf.
          </>
        )}
      </p>
    </aside>
  );
}
