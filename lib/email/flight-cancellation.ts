import type { StoredBooking } from "@/lib/bookings/types";
import type { CancellationRefundPlan } from "@/lib/flights/cancellation-policy";
import { formatMoney } from "@/lib/flights/format";
import { escapeHtml, sendResendEmail } from "@/lib/email/resend";
import { site } from "@/lib/site";

export async function sendFlightCancellationEmail(input: {
  booking: StoredBooking;
  plan: CancellationRefundPlan;
  stripeRefunded: boolean;
}): Promise<{ sent: boolean; error?: string }> {
  const { booking, plan, stripeRefunded } = input;
  const ref = booking.bookingReference || booking.orderId;
  const paid = formatMoney(booking.customerAmount, booking.currency);

  let refundLine: string;
  if (stripeRefunded && Number.parseFloat(plan.customerRefundAmount) > 0) {
    refundLine = `Card refund: ${formatMoney(plan.customerRefundAmount, plan.customerRefundCurrency)} (typically 5–10 business days).`;
  } else if (plan.stripeRefundEligible) {
    refundLine = `Expected card refund: ${formatMoney(plan.customerRefundAmount, plan.customerRefundCurrency)}.`;
  } else {
    refundLine = plan.policySummary;
  }

  const text = `Hi ${booking.passengerName},

Your flight booking with ${site.name} has been cancelled.

Booking reference: ${ref}
Order ID: ${booking.orderId}
Originally paid: ${paid}

${refundLine}

${plan.policyDetail}

Questions: ${site.email}

— ${site.name}`;

  const result = await sendResendEmail({
    to: [booking.passengerEmail],
    subject: `${site.name} — booking cancelled (${ref})`,
    text,
    html: `<p>Hi ${escapeHtml(booking.passengerName)},</p>
<p>Your flight booking has been <strong>cancelled</strong>.</p>
<p><strong>Reference:</strong> ${escapeHtml(ref)}<br/>
<strong>Order:</strong> ${escapeHtml(booking.orderId)}<br/>
<strong>Paid:</strong> ${escapeHtml(paid)}</p>
<p>${escapeHtml(refundLine)}</p>
<p>${escapeHtml(plan.policyDetail)}</p>
<p>Questions: <a href="mailto:${site.email}">${escapeHtml(site.email)}</a></p>`,
    replyTo: site.email,
  });

  return result.ok ? { sent: true } : { sent: false, error: result.error };
}
