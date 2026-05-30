/** Customer-facing Duffel Stays shapes (server-mapped). */

export type StayGuestInput = { type: "adult" } | { type: "child"; age: number };

export type StaySearchRequest = {
  checkInDate: string;
  checkOutDate: string;
  rooms: number;
  guests: StayGuestInput[];
  latitude: number;
  longitude: number;
  radiusKm?: number;
  markupPercent?: number;
};

export type StaySearchResultSummary = {
  searchResultId: string;
  accommodationId: string;
  name: string;
  cityName?: string;
  lineOne?: string;
  rating?: number;
  reviewScore?: number;
  photoUrl?: string;
  checkInDate: string;
  checkOutDate: string;
  rooms: number;
  baseAmount: string;
  currency: string;
  customerAmount: string;
  markupPercent: number;
  boardHint?: string;
};

export type StaySearchResponse = {
  liveMode: boolean;
  results: StaySearchResultSummary[];
};

export type StayRateSummary = {
  rateId: string;
  roomName: string;
  rateName: string;
  boardType?: string;
  description?: string;
  baseAmount: string;
  totalAmount: string;
  currency: string;
  customerAmount: string;
  markupPercent: number;
  paymentType?: string;
  refundable: boolean;
  cancellationTimeline: Array<{ before: string; refundAmount: string; currency: string }>;
  expiresAt?: string;
};

export type StayRatesResponse = {
  searchResultId: string;
  accommodationName: string;
  checkInDate: string;
  checkOutDate: string;
  rates: StayRateSummary[];
};

export type StayQuoteSummary = {
  quoteId: string;
  rateId: string;
  searchResultId?: string;
  accommodationName: string;
  roomName?: string;
  rateName?: string;
  checkInDate: string;
  checkOutDate: string;
  baseAmount: string;
  totalAmount: string;
  currency: string;
  customerAmount: string;
  markupPercent: number;
  supplierAmount: string;
  boardType?: string;
  cancellationTimeline: StayRateSummary["cancellationTimeline"];
  keyCollectionInstructions?: string;
  checkInAfterTime?: string;
  checkOutBeforeTime?: string;
  liveMode: boolean;
  expiresAt?: string;
};

export type StayBookGuest = {
  givenName: string;
  familyName: string;
  bornOn?: string;
};

export type StayBookRequest = {
  quoteId: string;
  email: string;
  phoneNumber: string;
  guests: StayBookGuest[];
  accommodationSpecialRequests?: string;
  paymentIntentId?: string;
  markupPercent?: number;
};

export type StayBookResponse = {
  bookingId: string;
  bookingReference: string;
  currency: string;
  customerAmount: string;
  supplierAmount: string;
  liveMode: boolean;
};
