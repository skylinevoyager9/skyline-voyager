import type { ReactNode } from "react";
import { FlightsPartnerLink } from "@/components/FlightsPartnerLink";
import { isHotelOtaPartnerEnabled } from "@/lib/booking/platform";
import type { PartnerKey } from "@/lib/partner-links";
import { isAffiliateLink, partnerUrl } from "@/lib/partner-links";

type Props = {
  partner: PartnerKey;
  children: ReactNode;
  className?: string;
};

export function PartnerOutboundLink({ partner, children, className }: Props) {
  if (partner === "booking" && !isHotelOtaPartnerEnabled()) {
    return <FlightsPartnerLink className={className}>{children}</FlightsPartnerLink>;
  }

  const href = partnerUrl(partner);
  const sponsored = isAffiliateLink(partner);
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel={
        sponsored
          ? "sponsored noopener noreferrer"
          : "noopener noreferrer"
      }
    >
      {children}
    </a>
  );
}
