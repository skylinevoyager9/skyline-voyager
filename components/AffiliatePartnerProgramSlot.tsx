type Props = {
  className?: string;
};

/**
 * Styled placeholder for future approved partner widgets or deep links only.
 * Do not embed third-party branding or scripts until your program contract allows it.
 */
export function AffiliatePartnerProgramSlot({ className = "" }: Props) {
  return (
    <section
      aria-labelledby="affiliate-program-slot-h"
      className={`rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-6 ${className}`}
    >
      <h2
        id="affiliate-program-slot-h"
        className="text-sm font-semibold text-stone-800"
      >
        Optional partner embed area
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        After a travel-affiliate program approves your site, widgets or
        authenticated deep links from that program can be placed here without
        changing the rest of the page layout.
      </p>
    </section>
  );
}
