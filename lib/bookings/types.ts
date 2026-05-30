import type { FlightOfferSummary } from "@/lib/duffel/types";
import type { StayQuoteSummary } from "@/lib/duffel/stays-types";

export type BookingProduct = "flight" | "stay";

export type StoredBooking = {
  id: string;
  product: BookingProduct;
  orderId: string;
  bookingReference: string;
  passengerEmail: string;
  passengerName: string;
  offerId: string;
  customerAmount: string;
  currency: string;
  liveMode: boolean;
  createdAt: string;
  itinerarySummary: string;
  paymentIntentId?: string;
  /** Set when customer cancellation is confirmed. */
  cancelledAt?: string;
  duffelCancellationId?: string;
  customerRefundedAmount?: string;
  refundStatus?: "none" | "partial" | "full" | "airline_credit" | "unknown";
};

export type SaveFlightBookingInput = {
  orderId: string;
  bookingReference?: string;
  passengers: { givenName: string; familyName: string; email: string }[];
  offer: FlightOfferSummary;
  customerAmount: string;
  currency: string;
  liveMode: boolean;
  paymentIntentId?: string;
};

export type SaveStayBookingInput = {
  bookingId: string;
  bookingReference?: string;
  email: string;
  guestName: string;
  quote: StayQuoteSummary;
  customerAmount: string;
  currency: string;
  liveMode: boolean;
  paymentIntentId?: string;
};

/** @deprecated Use SaveFlightBookingInput */
export type SaveBookingInput = SaveFlightBookingInput;
