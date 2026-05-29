/** Server-only Stripe configuration. */

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

export function getStripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || undefined;
}

const INCOMPLETE_KEYS = new Set(["sk_test_", "sk_live_", "pk_test_", "pk_live_"]);

/** True only when both keys look like real Stripe keys (not placeholders). */
export function isStripeConfigured(): boolean {
  const sk = getStripeSecretKey();
  const pk = getStripePublishableKey();
  if (!sk || !pk) return false;
  if (INCOMPLETE_KEYS.has(sk) || INCOMPLETE_KEYS.has(pk)) return false;
  if (!sk.startsWith("sk_") || !pk.startsWith("pk_")) return false;
  if (sk.length < 24 || pk.length < 24) return false;
  return true;
}
