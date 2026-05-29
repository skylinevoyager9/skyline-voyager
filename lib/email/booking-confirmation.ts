import type { StoredBooking } from "@/lib/bookings/types";
import type { FlightOfferSummary } from "@/lib/duffel/types";
import { formatMoney } from "@/lib/flights/format";
import { escapeHtml, sendResendEmail } from "@/lib/email/resend";
import { site } from "@/lib/site";

function itineraryHtml(offer: FlightOfferSummary): string {
  return offer.slices
    .map((slice) => {
      const segs = slice.segments
        .map(
          (seg) =>
            `<li>${escapeHtml(seg.marketingCarrier)} ${escapeHtml(seg.origin)}→${escapeHtml(seg.destination)} · ${escapeHtml(seg.departingAt)}</li>`,
        )
        .join("");
      return `<p><strong>${escapeHtml(slice.origin)} → ${escapeHtml(slice.destination)}</strong> (${escapeHtml(slice.departureDate)})</p><ul>${segs}</ul>`;
    })
    .join("");
}

export async function sendBookingConfirmationEmail(input: {
  booking: StoredBooking;
  offer: FlightOfferSummary;
}): Promise<{ sent: boolean; error?: string }> {
  const { booking, offer } = input;
  const ref = booking.bookingReference || booking.orderId;
  const total = formatMoney(booking.customerAmount, booking.currency);
  const lookupUrl = `${site.url}/flights/lookup?ref=${encodeURIComponent(booking.bookingReference)}&email=${encodeURIComponent(booking.passengerEmail)}`;

  const text = `Hi ${booking.passengerName},

Your flight booking with ${site.name} is confirmed.

Booking reference: ${ref}
Order ID: ${booking.orderId}
Total paid: ${total}

${booking.itinerarySummary}

Manage or look up this booking: ${lookupUrl}

Questions? Reply to this email or contact ${site.email}.

— ${site.name}`;

  const html = `
    <p>Hi ${escapeHtml(booking.passengerName)},</p>
    <p>Your flight booking with <strong>${escapeHtml(site.name)}</strong> is confirmed.</p>
    <p><strong>Booking reference:</strong> ${escapeHtml(ref)}<br/>
    <strong>Order ID:</strong> ${escapeHtml(booking.orderId)}<br/>
    <strong>Total paid:</strong> ${escapeHtml(total)}</p>
    ${itineraryHtml(offer)}
    <p><a href="${escapeHtml(lookupUrl)}">Look up this booking</a></p>
    <p>Questions? Reply to this email or contact ${escapeHtml(site.email)}.</p>
  `;

  const result = await sendResendEmail({
    to: [booking.passengerEmail],
    subject: `${site.name} — booking confirmed (${ref})`,
    text,
    html,
    replyTo: site.email,
  });

  if (!result.ok) return { sent: false, error: result.error };
  return { sent: true };
}
