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
  /** Duffel slice filter — HH:MM (24h). */
  departureTime?: { from?: string; to?: string };
  arrivalTime?: { from?: string; to?: string };
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
  /** Optional time filters on the first outbound slice (Duffel search best practice). */
  outboundDepartureTime?: { from?: string; to?: string };
  outboundArrivalTime?: { from?: string; to?: string };
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

export type FlightAvailableServiceType = "baggage";

export type FlightAvailableService = {
  id: string;
  type: FlightAvailableServiceType;
  totalAmount: string;
  totalCurrency: string;
  maximumQuantity: number;
  segmentIds: string[];
  passengerIds: string[];
  /** Guest-facing label, e.g. "Checked bag · 23kg". */
  label: string;
};

export type SelectedFlightService = {
  serviceId: string;
  quantity: number;
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
  /** Extra bags (when offer fetched with return_available_services). */
  availableServices?: FlightAvailableService[];
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
  /** Duffel available_services (baggage) to add to the order. */
  selectedServices?: SelectedFlightService[];
};

export type FlightBookResponse = {
  orderId: string;
  bookingReference?: string;
  currency: string;
  customerAmount: string;
  baseAmount: string;
  liveMode: boolean;
  emailSent?: boolean;
  selectedServices?: SelectedFlightService[];
};
