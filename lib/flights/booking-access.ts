import { findBookingByOrderId } from "@/lib/bookings/store";
import type { StoredBooking } from "@/lib/bookings/types";

export class BookingAccessError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "validation_error" = "not_found",
  ) {
    super(message);
    this.name = "BookingAccessError";
  }
}

export async function assertBookingAccess(
  email: string,
  orderId: string,
): Promise<StoredBooking> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !orderId.startsWith("ord_")) {
    throw new BookingAccessError("Invalid email or order.", "validation_error");
  }

  const booking = await findBookingByOrderId(orderId);
  if (!booking || booking.passengerEmail.trim().toLowerCase() !== normalizedEmail) {
    throw new BookingAccessError("No booking found for those details.");
  }

  return booking;
}
