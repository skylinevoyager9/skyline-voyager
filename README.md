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

## Environment variables (affiliate links)

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_FLIGHTS_AFFILIATE_URL` | Flight search / OTA tracking URL |
| `NEXT_PUBLIC_BOOKING_AFFILIATE_URL` | Hotels / booking partner |
| `NEXT_PUBLIC_CAR_RENTAL_AFFILIATE_URL` | Car rental partner |
| `NEXT_PUBLIC_VIATOR_AFFILIATE_URL` | Viator |
| `NEXT_PUBLIC_GETYOURGUIDE_AFFILIATE_URL` | GetYourGuide |

Copy `.env.example` → `.env.local` for local dev; set the same keys in **Vercel → Settings → Environment Variables** for production. If unset, buttons use public homepages (no commission). Redeploy after changes.

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
| `/about`, `/contact`, `/legal`, `/privacy`, `/terms`, `/affiliate-disclosure` | Company & legal |
| `/sitemap.xml`, `/robots.txt` | SEO |

Have a lawyer review **privacy**, **terms**, and **disclosure** for your business.
