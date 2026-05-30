import type { StoredBooking } from "@/lib/bookings/types";
import type { StayQuoteSummary } from "@/lib/duffel/stays-types";
import { formatMoney } from "@/lib/flights/format";
import { escapeHtml, sendResendEmail } from "@/lib/email/resend";
import { site } from "@/lib/site";

export async function sendStayConfirmationEmail(input: {
  booking: StoredBooking;
  quote: StayQuoteSummary;
}): Promise<{ sent: boolean; error?: string }> {
  const { booking, quote } = input;
  const ref = booking.bookingReference || booking.orderId;
  const total = formatMoney(booking.customerAmount, booking.currency);
  const lookupUrl = `${site.url}/stays/lookup?ref=${encodeURIComponent(booking.bookingReference)}&email=${encodeURIComponent(booking.passengerEmail)}`;

  const keyNote = quote.keyCollectionInstructions
    ? `\nKey collection: ${quote.keyCollectionInstructions}`
    : "";

  const text = `Hi ${booking.passengerName},

Your hotel stay with ${site.name} is confirmed.

Booking reference: ${ref}
Booking ID: ${booking.orderId}
Property: ${quote.accommodationName}
Check-in: ${quote.checkInDate}
Check-out: ${quote.checkOutDate}
Total paid: ${total}
${keyNote}

Look up this booking: ${lookupUrl}

Questions? Reply to this email or contact ${site.email}.

— ${site.name}`;

  const html = `
    <p>Hi ${escapeHtml(booking.passengerName)},</p>
    <p>Your stay with <strong>${escapeHtml(site.name)}</strong> is confirmed.</p>
    <p><strong>Booking reference:</strong> ${escapeHtml(ref)}<br/>
    <strong>Property:</strong> ${escapeHtml(quote.accommodationName)}<br/>
    <strong>Check-in:</strong> ${escapeHtml(quote.checkInDate)}<br/>
    <strong>Check-out:</strong> ${escapeHtml(quote.checkOutDate)}<br/>
    <strong>Total paid:</strong> ${escapeHtml(total)}</p>
    ${quote.keyCollectionInstructions ? `<p><strong>Key collection:</strong> ${escapeHtml(quote.keyCollectionInstructions)}</p>` : ""}
    <p><a href="${escapeHtml(lookupUrl)}">Look up this booking</a></p>
    <p>Questions? Reply to this email or contact ${escapeHtml(site.email)}.</p>
  `;

  const result = await sendResendEmail({
    to: [booking.passengerEmail],
    subject: `${site.name} — stay confirmed (${ref})`,
    text,
    html,
    replyTo: site.email,
  });

  if (!result.ok) return { sent: false, error: result.error };
  return { sent: true };
}
