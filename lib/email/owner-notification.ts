import { site } from "@/lib/site";

/** Inbox that receives a BCC on every booking confirmation (flights + stays). */
export function getBookingOwnerNotificationEmail(): string | undefined {
  const explicit = process.env.BOOKING_OWNER_EMAIL?.trim();
  if (explicit) return explicit;
  const contact = process.env.CONTACT_TO_EMAIL?.trim();
  if (contact) return contact;
  return site.email;
}
