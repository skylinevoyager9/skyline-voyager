/** Convert a Duffel-style decimal amount to Stripe's smallest currency unit. */
export function decimalToStripeMinorUnits(amount: string, currency: string): number {
  const value = Number.parseFloat(amount);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  const code = currency.toLowerCase();
  const zeroDecimal = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
  if (zeroDecimal.has(code)) {
    return Math.round(value);
  }
  return Math.round(value * 100);
}
