type ErrorContext = Record<string, string | number | boolean | undefined>;

/** Structured server-side error logging (optional Sentry DSN later). */
export function reportServerError(error: unknown, context?: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      message,
      stack,
      ...context,
      at: new Date().toISOString(),
    }),
  );
}
