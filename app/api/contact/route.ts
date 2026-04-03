import { site } from "@/lib/site";

const MAX_NAME = 120;
const MAX_MESSAGE = 8000;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { ok: false as const, error: "not_configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false as const, error: "invalid_json" }, {
      status: 400,
    });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ ok: false as const, error: "invalid_body" }, {
      status: 400,
    });
  }

  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const message = typeof b.message === "string" ? b.message.trim() : "";

  if (name.length < 2 || name.length > MAX_NAME) {
    return Response.json({ ok: false as const, error: "invalid_name" }, {
      status: 400,
    });
  }
  if (!isValidEmail(email)) {
    return Response.json({ ok: false as const, error: "invalid_email" }, {
      status: 400,
    });
  }
  if (message.length < 10 || message.length > MAX_MESSAGE) {
    return Response.json({ ok: false as const, error: "invalid_message" }, {
      status: 400,
    });
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || site.email;
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    "Skyline Voyager <onboarding@resend.dev>";

  const textBody = `Name: ${name}\nEmail: ${email}\n\n---\n\n${message}`;
  const htmlBody = `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><hr /><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(message)}</pre>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `[Skyline Voyager] Message from ${name}`,
      text: textBody,
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error("Resend API error", res.status, raw);
    let resendMessage = "";
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j.message === "string") resendMessage = j.message;
    } catch {
      /* ignore */
    }
    return Response.json(
      {
        ok: false as const,
        error: "send_failed" as const,
        detail: resendMessage || undefined,
      },
      { status: 502 },
    );
  }

  return Response.json({ ok: true as const });
}
