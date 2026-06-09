/** Primary product nav — Flights, Stays, Cars only. */
export const PRODUCT_NAV = [
  { id: "flights", href: "/flights", label: "Flights", flights: true },
  { id: "stays", href: "/hotels", label: "Stays", stays: true },
  { id: "cars", href: "/car-rentals", label: "Cars" },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/about#how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: "/legal", label: "Legal overview" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
] as const;
