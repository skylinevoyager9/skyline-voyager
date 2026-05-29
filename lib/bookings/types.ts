import type { FlightOfferSummary } from "@/lib/duffel/types";

export type StoredBooking = {
  id: string;
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
};

export type SaveBookingInput = {
  orderId: string;
  bookingReference?: string;
  passengers: { givenName: string; familyName: string; email: string }[];
  offer: FlightOfferSummary;
  customerAmount: string;
  currency: string;
  liveMode: boolean;
  paymentIntentId?: string;
};
