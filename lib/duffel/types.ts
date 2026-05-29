/** Public API types (safe to use in client components). */

export type CabinClass =
  | "economy"
  | "premium_economy"
  | "business"
  | "first";

export type TripType = "one_way" | "return" | "multi_city";

export type FlightSearchSlice = {
  origin: string;
  destination: string;
  departureDate: string;
};

export type FlightSearchRequest = {
  tripType: TripType;
  /** First leg (one-way / return). */
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  /** Multi-city legs (2–4). */
  slices?: FlightSearchSlice[];
  adults: number;
  children?: number;
  cabinClass: CabinClass;
  /** 0 = direct only, 1 = up to one connection (Duffel default). */
  maxConnections?: 0 | 1 | 2;
  /** Search outbound ±N days and merge cheapest offers (one-way / return only). */
  flexDays?: 0 | 1 | 3;
};

export type FlightSegmentSummary = {
  origin: string;
  originName?: string;
  destination: string;
  destinationName?: string;
  departingAt: string;
  arrivingAt: string;
  marketingCarrier: string;
  operatingCarrier: string;
  flightNumber?: string;
  duration?: string;
};

export type FlightSliceSummary = {
  origin: string;
  destination: string;
  departureDate: string;
  segments: FlightSegmentSummary[];
};

export type FareRulesSummary = {
  changeAllowed: boolean | null;
  changePenalty: string | null;
  refundAllowed: boolean | null;
  refundPenalty: string | null;
  baggageSummary: string | null;
};

export type FlightOfferSummary = {
  id: string;
  currency: string;
  baseAmount: string;
  markupPercent: number;
  markupAmount: string;
  customerAmount: string;
  expiresAt?: string;
  ownerName?: string;
  slices: FlightSliceSummary[];
  passengerIds: string[];
  /** Pay Duffel this amount when booking (base fare). */
  paymentAmount: string;
  paymentCurrency: string;
  /** Max connections on any slice (0 = nonstop). */
  stops: number;
  totalDurationMinutes: number;
  /** When flex search was used, outbound date for this offer. */
  outboundDate?: string;
  fareRules?: FareRulesSummary;
};

export type FlightSearchResponse = {
  offerRequestId: string;
  liveMode: boolean;
  offers: FlightOfferSummary[];
  /** Dates searched when flexDays > 0. */
  flexDatesSearched?: string[];
  /** Set by search API when owner key is valid; never "owner" for public responses. */
  pricingView?: "owner" | "public";
  /** Service fee % used for these results (same rate enforced at checkout). */
  appliedMarkupPercent?: number;
};

export type BookPassengerInput = {
  passengerId: string;
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: "m" | "f";
  title: "mr" | "mrs" | "ms" | "miss" | "dr";
  email: string;
  phoneNumber: string;
};

export type FlightBookRequest = {
  offerId: string;
  passengers: BookPassengerInput[];
  /** Required when Stripe checkout is enabled (server verifies before Duffel order). */
  paymentIntentId?: string;
  /** Service fee % locked from search (must match server policy). */
  markupPercent?: number;
};

export type FlightBookResponse = {
  orderId: string;
  bookingReference?: string;
  currency: string;
  customerAmount: string;
  baseAmount: string;
  liveMode: boolean;
  emailSent?: boolean;
};
