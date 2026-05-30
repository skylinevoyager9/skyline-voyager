import type { StayBookRequest, StayGuestInput, StaySearchRequest } from "@/lib/duffel/stays-types";

type ParsedStaySearch = Omit<StaySearchRequest, "markupPercent"> & {
  locationQuery?: string;
};

export function parseStaySearchBody(body: unknown):
  | { ok: true; value: ParsedStaySearch }
  | { ok: false; error: string; field?: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid body.", field: "body" };
  }
  const b = body as Record<string, unknown>;

  const checkInDate = typeof b.checkInDate === "string" ? b.checkInDate.trim() : "";
  const checkOutDate = typeof b.checkOutDate === "string" ? b.checkOutDate.trim() : "";
  const latitude = Number(b.latitude);
  const longitude = Number(b.longitude);
  const rooms = Number(b.rooms);
  const locationQuery = typeof b.locationQuery === "string" ? b.locationQuery.trim() : "";

  if (!checkInDate || !/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
    return { ok: false, error: "Valid check-in date required.", field: "checkInDate" };
  }
  if (!checkOutDate || !/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)) {
    return { ok: false, error: "Valid check-out date required.", field: "checkOutDate" };
  }
  if (checkOutDate <= checkInDate) {
    return { ok: false, error: "Check-out must be after check-in.", field: "checkOutDate" };
  }
  const needsGeocode = !Number.isFinite(latitude) || !Number.isFinite(longitude);
  if (needsGeocode && !locationQuery) {
    return { ok: false, error: "Destination is required.", field: "locationQuery" };
  }
  if (!Number.isFinite(rooms) || rooms < 1 || rooms > 8) {
    return { ok: false, error: "Rooms must be between 1 and 8.", field: "rooms" };
  }

  const adults = Number(b.adults);
  const children = Number(b.children ?? 0);
  if (!Number.isFinite(adults) || adults < 1 || adults > 9) {
    return { ok: false, error: "Adults must be between 1 and 9.", field: "adults" };
  }
  if (!Number.isFinite(children) || children < 0 || children > 8) {
    return { ok: false, error: "Invalid children count.", field: "children" };
  }

  const guests: StayGuestInput[] = Array.from({ length: adults }, () => ({ type: "adult" }));
  for (let i = 0; i < children; i += 1) {
    guests.push({ type: "child", age: 8 });
  }

  const radiusKm =
    b.radiusKm === undefined ? undefined : Number(b.radiusKm);

  return {
    ok: true,
    value: {
      checkInDate,
      checkOutDate,
      rooms: Math.floor(rooms),
      guests,
      latitude: needsGeocode ? NaN : latitude,
      longitude: needsGeocode ? NaN : longitude,
      radiusKm: Number.isFinite(radiusKm) ? radiusKm : undefined,
      locationQuery: needsGeocode ? locationQuery : undefined,
    },
  };
}

export function parseStayBookBody(body: unknown):
  | { ok: true; value: StayBookRequest }
  | { ok: false; error: string; field?: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid body.", field: "body" };
  }
  const b = body as Record<string, unknown>;
  const quoteId = typeof b.quoteId === "string" ? b.quoteId.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const phoneNumber = typeof b.phoneNumber === "string" ? b.phoneNumber.trim() : "";
  const paymentIntentId =
    typeof b.paymentIntentId === "string" ? b.paymentIntentId.trim() : undefined;
  const accommodationSpecialRequests =
    typeof b.accommodationSpecialRequests === "string"
      ? b.accommodationSpecialRequests
      : undefined;
  const markupPercent =
    typeof b.markupPercent === "number" && Number.isFinite(b.markupPercent)
      ? b.markupPercent
      : undefined;

  if (!quoteId.startsWith("quo_")) {
    return { ok: false, error: "Invalid quote id.", field: "quoteId" };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "Valid email required.", field: "email" };
  }
  if (!phoneNumber.startsWith("+")) {
    return { ok: false, error: "Phone must be E.164 format (e.g. +12025550100).", field: "phoneNumber" };
  }

  const guestsRaw = b.guests;
  if (!Array.isArray(guestsRaw) || guestsRaw.length === 0) {
    return { ok: false, error: "At least one guest required.", field: "guests" };
  }

  const guests = guestsRaw.map((g, i) => {
    if (!g || typeof g !== "object") {
      return { givenName: "", familyName: "" };
    }
    const o = g as Record<string, unknown>;
    return {
      givenName: typeof o.givenName === "string" ? o.givenName.trim() : "",
      familyName: typeof o.familyName === "string" ? o.familyName.trim() : "",
      bornOn: typeof o.bornOn === "string" ? o.bornOn.trim() : undefined,
    };
  });

  for (let i = 0; i < guests.length; i += 1) {
    if (!guests[i].givenName || !guests[i].familyName) {
      return { ok: false, error: `Guest ${i + 1} name required.`, field: "guests" };
    }
  }

  return {
    ok: true,
    value: {
      quoteId,
      email,
      phoneNumber,
      guests,
      paymentIntentId,
      accommodationSpecialRequests,
      markupPercent,
    },
  };
}
