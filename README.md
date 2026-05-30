# Skyline Voyager — website

Enterprise-style Next.js site for **skylinevoyager.com**: topic hubs (flights, hotels, weekends, national parks, cars, planning), **20+** guides, affiliate CTAs, legal pages, SEO, sitemap, and Open Graph images.

**Layout:** The Next.js app lives at the **repository root** (`package.json`, `app/`, `components/`, …). No nested `web/` folder—this matches Vercel/GitHub defaults.

---

## Start from zero (clone → run → deploy)

### 1. Clone into a path **without spaces** (recommended)

```bash
# Example: rename your local folder to something URL-friendly
cd ~/projects
git clone <your-repo-url> skyline-voyager
cd skyline-voyager
```

If your local folder is `Travel-booking` (or similar with a hyphen), no quotes are needed:

```bash
cd ~/Travel-booking
```

### 2. Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Build

```bash
npm run build
npm run start
```

### 4. Deploy on Vercel (free tier)

1. Push this repo to **GitHub** (repo name suggestion: `skyline-voyager` or `travel-booking`—**no spaces**).
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. **Root Directory:** leave as **`.`** (default)—the app is already at the repo root.
4. **Settings → Domains** → add `skylinevoyager.com` (and `www` if you use it).
5. At **GoDaddy** (or your registrar), set DNS to what Vercel shows (A/CNAME or Vercel nameservers).

You do **not** need traditional “shared hosting” for this stack—Vercel *is* the host. For email at `@skylinevoyager.com`, use Google Workspace, Microsoft 365, or your registrar’s email; that is separate from web hosting.

**Paid options:** Vercel **Pro** if you need higher limits. Alternatives: Netlify, Cloudflare Pages, or a **VPS + Node** (more ops work).

---

## Flight booking (Duffel + Stripe)

Flights are searched and booked **on this site** (not via affiliate redirects). Copy `.env.example` → `.env.local`.

| Area | Key variables |
|------|----------------|
| Duffel | `DUFFEL_API_TOKEN`, `DUFFEL_MODE` (`test` \| `live`) |
| Pricing | `FLIGHT_MARKUP_PERCENT`, optional min/max caps |
| Owner | `OWNER_PRICING_KEY` — private URL `?owner=…` to publish live service fee |
| Stripe | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Persistence (Vercel) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Email | `RESEND_API_KEY`, `CONTACT_TO_EMAIL` — booking confirmations |

**Routes:** `/flights/search` · `/flights/book` · `/flights/lookup`

**Go live:** use `duffel_live_` + `DUFFEL_MODE=live`, `sk_live_` + `pk_live_`, fund Duffel balance, configure Stripe webhook, set Production env on Vercel, redeploy.

---

## Stays booking (Duffel Stays + Stripe)

Hotels and stays use the **same Duffel token** and **same service fee** as flights. Request **Stays API access** in the Duffel dashboard (Developers → Stays) before searching.

| Area | Notes |
|------|--------|
| Duffel | Same `DUFFEL_API_TOKEN`, `DUFFEL_MODE`, `DUFFEL_VERSION` |
| Pricing | Reuses published flight markup (`FLIGHT_MARKUP_PERCENT` / owner publish) |
| Stripe | Same keys and webhook as flights |
| Email | Same Resend keys — stay confirmation emails |

**Routes:** `/stays/search` · `/stays/book` · `/stays/lookup`

Flow: search by city → pick property → choose rate → quote → Stripe checkout → Duffel booking (balance / pay-as-you-go).

---

## Environment variables (optional affiliate links)

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_CAR_RENTAL_AFFILIATE_URL` | Car rental partner |
| `NEXT_PUBLIC_VIATOR_AFFILIATE_URL` | Viator |
| `NEXT_PUBLIC_GETYOURGUIDE_AFFILIATE_URL` | GetYourGuide |

Redeploy after env changes.

---

## Site configuration

- **`lib/site.ts`** — brand name, domain, URL, email.
- **`lib/guides/data.ts`** — guide articles (add `category`: `flights` | `hotels` | `weekends` | `parks` | `cars` | `planning`).
- **`lib/guides/types.ts`** — category labels and hub paths.

---

## Main routes

| Path | Purpose |
|------|--------|
| `/` | Home |
| `/flights`, `/hotels`, `/weekend-trips`, `/national-parks`, `/car-rentals`, `/travel-planning` | Topic hubs |
| `/guides` | All guides + category filters (`?cat=flights`, etc.) |
| `/guides/[slug]` | Article |
| `/flights/search`, `/flights/book`, `/flights/lookup` | Duffel flight search, checkout, lookup |
| `/stays/search`, `/stays/book`, `/stays/lookup` | Duffel Stays search, checkout, lookup |
| `/about`, `/contact`, `/legal`, `/privacy`, `/terms`, `/affiliate-disclosure` | Company & legal |
| `/sitemap.xml`, `/robots.txt` | SEO |

Have a lawyer review **privacy**, **terms**, and **disclosure** for your business.
