"use client";

import { useState, type FormEvent } from "react";

type Props = {
  /** When false, API route will not send; we show mailto-focused hint. */
  enabled: boolean;
  fallbackEmail: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ enabled, fallbackEmail }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enabled) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    setIsSubmitting(true);
    setStatus("idle");
    setErrorKey(null);
    setErrorDetail(null);

    try {
      if (name.length < 2) {
        setStatus("error");
        setErrorKey("validation_name");
        return;
      }
      if (!EMAIL_RE.test(email)) {
        setStatus("error");
        setErrorKey("validation_email");
        return;
      }
      if (message.length < 10) {
        setStatus("error");
        setErrorKey("validation_message");
        return;
      }

      const payload = { name, email, message };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data: { ok?: boolean; error?: string; detail?: string } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        /* non-JSON error body */
      }

      if (res.status === 503 && data.error === "not_configured") {
        setStatus("error");
        setErrorKey("not_configured");
        return;
      }
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorKey(data.error ?? "send_failed");
        if (typeof data.detail === "string" && data.detail.trim() !== "") {
          setErrorDetail(data.detail.trim());
        }
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorKey("network");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-faint)] focus:border-teal-600/40 focus:ring-2 focus:ring-teal-600/20";

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
        Send a message
      </p>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed">
        {enabled
          ? "We read every note. Replies go to the address you enter below."
          : "The message form isn’t active on this deployment yet. You can still reach us at:"}
      </p>

      {!enabled ? (
        <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
          <a
            href={`mailto:${fallbackEmail}`}
            className="text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            {fallbackEmail}
          </a>
        </p>
      ) : (
        <form
          className="relative mt-6 space-y-5"
          onSubmit={onSubmit}
          noValidate
          autoComplete="off"
        >
          <div>
            <label
              htmlFor="contact-name"
              className="text-sm font-medium text-[var(--color-ink)]"
            >
              Name
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              minLength={2}
              maxLength={120}
              autoComplete="name"
              disabled={isSubmitting}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="contact-email"
              className="text-sm font-medium text-[var(--color-ink)]"
            >
              Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="text-sm font-medium text-[var(--color-ink)]"
            >
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              minLength={10}
              maxLength={8000}
              rows={5}
              disabled={isSubmitting}
              className={`${inputClass} resize-y min-h-[120px]`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? "Sending…" : "Send message"}
          </button>

          {status === "success" ? (
            <p
              className="rounded-xl border border-teal-600/25 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900"
              role="status"
            >
              Thanks — your message was sent. We&apos;ll get back to you when we
              can.
            </p>
          ) : null}

          {status === "error" && errorKey ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="alert"
            >
              <p>
                {errorKey === "not_configured"
                  ? `This form isn’t configured here yet. Email ${fallbackEmail} directly.`
                  : errorKey === "validation_name"
                    ? "Please enter your name (at least 2 characters)."
                    : errorKey === "validation_email"
                      ? "Please enter a valid email address."
                      : errorKey === "validation_message"
                        ? "Please enter a message (at least 10 characters)."
                        : errorKey === "invalid_name" ||
                              errorKey === "invalid_email" ||
                              errorKey === "invalid_message"
                            ? "Please check the fields and try again."
                            : errorKey === "network"
                              ? "Something went wrong with the connection. Try again or email us directly."
                              : "We couldn’t send that just now. Please try again or email us directly."}
              </p>
              {errorDetail ? (
                <p className="mt-2 border-t border-red-200/80 pt-2 text-xs leading-relaxed text-red-800">
                  {errorDetail}
                </p>
              ) : null}
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}
