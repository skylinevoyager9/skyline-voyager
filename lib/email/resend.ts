export async function sendResendEmail(input: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  bcc?: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }

  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    "Skyline Voyager <onboarding@resend.dev>";

  const bcc = input.bcc?.map((e) => e.trim()).filter(Boolean);
  const payload: Record<string, unknown> = {
    from,
    to: input.to,
    reply_to: input.replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
  };
  if (bcc?.length) payload.bcc = bcc;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error("Resend error", res.status, raw);
    return { ok: false, error: "Could not send email." };
  }

  return { ok: true };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
